"""LangGraph agent graph definition for the TravelBuddy assistant.

Builds a simple agent loop: LLM node -> (tool calls? -> tool node -> LLM node | END).
Checkpointing via in-memory saver enables conversation continuity across turns.
"""

from typing import Annotated
from typing_extensions import TypedDict

from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

from backend.settings import settings
from backend.agent.memory import apply_window

_MAX_TOOL_CALLS_PER_TURN = 3


class AgentState(TypedDict):
    """Shared state flowing through the agent graph — just a message history."""
    messages: Annotated[list[BaseMessage], add_messages]


# In-memory checkpointer persists conversation state between requests.
# For production, replace with a durable backend (e.g. PostgresSaver).
_checkpointer = MemorySaver()
_graph = None


def _tool_calls_this_turn(messages: list[BaseMessage]) -> int:
    """Count tool invocations since the most recent HumanMessage."""
    count = 0
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            break
        if isinstance(msg, AIMessage) and msg.tool_calls:
            count += len(msg.tool_calls)
    return count


def _route_after_llm(state: AgentState) -> str:
    """Route to tools, a forced-final LLM call, or END."""
    last_msg = state["messages"][-1]
    if isinstance(last_msg, AIMessage) and last_msg.tool_calls:
        if _tool_calls_this_turn(state["messages"]) <= _MAX_TOOL_CALLS_PER_TURN:
            return "tool_node"
        return "final_node"  # cap hit — force a conclusive answer without more tool calls
    return END


def build_graph(tools: list, system_prompt: str):
    """Compile the LangGraph agent graph with the given tools and system prompt.

    Must be called once at startup before any /chat request is served.
    """
    global _graph

    # Low temperature (0.2) reduces hallucination for fact-oriented travel queries
    llm = ChatOpenAI(
        model=settings.effective_model,
        base_url=settings.effective_base_url,
        api_key=settings.effective_api_key,
        temperature=0.2,
    )
    llm_with_tools = llm.bind_tools(tools)

    def llm_node(state: AgentState, config: RunnableConfig):
        """Invoke the LLM with tool bindings and the current message history."""
        mode = config.get("configurable", {}).get("mode", "text")
        effective_prompt = system_prompt
        # Voice mode appends additional formatting constraints to the system prompt
        if mode == "voice":
            effective_prompt += (
                "\n\nCURRENT MODE: voice — use plain prose only. "
                "No markdown, no bullet lists, no asterisks, no URLs."
            )
        # Apply sliding window to keep context manageable and save tokens
        windowed = apply_window(state["messages"], effective_prompt, settings.MEMORY_WINDOW)
        response = llm_with_tools.invoke(windowed)
        return {"messages": [response]}

    # Variant of llm_node without tools — used to force a final answer when the
    # per-turn tool-call cap is exceeded so the agent cannot keep retrying.
    llm_plain = ChatOpenAI(
        model=settings.effective_model,
        base_url=settings.effective_base_url,
        api_key=settings.effective_api_key,
        temperature=0.2,
    )

    def final_node(state: AgentState, config: RunnableConfig):
        mode = config.get("configurable", {}).get("mode", "text")
        effective_prompt = system_prompt + (
            "\n\nYou have already searched for information. "
            "Now give the user a complete, helpful answer based on what the tools returned. "
            "Do NOT call any more tools."
        )
        if mode == "voice":
            effective_prompt += (
                "\n\nCURRENT MODE: voice — use plain prose only. "
                "No markdown, no bullet lists, no asterisks, no URLs."
            )
        windowed = apply_window(state["messages"], effective_prompt, settings.MEMORY_WINDOW)
        # Drop any trailing AIMessage that has pending tool_calls — the API
        # requires every tool_calls entry to be followed by ToolMessages, which
        # we are intentionally skipping here.
        while windowed and isinstance(windowed[-1], AIMessage) and windowed[-1].tool_calls:
            windowed.pop()
        response = llm_plain.invoke(windowed)
        return {"messages": [response]}

    tool_node = ToolNode(tools)

    builder = StateGraph(AgentState)
    builder.add_node("llm_node", llm_node)
    builder.add_node("tool_node", tool_node)
    builder.add_node("final_node", final_node)
    builder.add_edge(START, "llm_node")
    builder.add_conditional_edges("llm_node", _route_after_llm)
    builder.add_edge("tool_node", "llm_node")
    builder.add_edge("final_node", END)

    _graph = builder.compile(checkpointer=_checkpointer)
    return _graph


def get_graph():
    """Return the singleton compiled agent graph (built during lifespan startup)."""
    return _graph
