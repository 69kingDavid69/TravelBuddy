"""LangGraph agent graph definition for the TravelBuddy assistant.

Builds a simple agent loop: LLM node -> (tool calls? -> tool node -> LLM node | END).
Checkpointing via in-memory saver enables conversation continuity across turns.
"""

from typing import Annotated
from typing_extensions import TypedDict

from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

from backend.settings import settings
from backend.agent.memory import apply_window


class AgentState(TypedDict):
    """Shared state flowing through the agent graph — just a message history."""
    messages: Annotated[list[BaseMessage], add_messages]


# In-memory checkpointer persists conversation state between requests.
# For production, replace with a durable backend (e.g. PostgresSaver).
_checkpointer = MemorySaver()
_graph = None


def _route_after_llm(state: AgentState) -> str:
    """Decide whether to invoke tools or end the turn.

    If the last assistant message contains tool_calls, route to the tool node;
    otherwise end the graph execution so the reply reaches the client.
    """
    last_msg = state["messages"][-1]
    if isinstance(last_msg, AIMessage) and last_msg.tool_calls:
        return "tool_node"
    return END


def build_graph(tools: list, system_prompt: str):
    """Compile the LangGraph agent graph with the given tools and system prompt.

    Must be called once at startup before any /chat request is served.
    """
    global _graph

    # Low temperature (0.2) reduces hallucination for fact-oriented travel queries
    llm = ChatOpenAI(
        model=settings.DEEPSEEK_MODEL,
        base_url=settings.DEEPSEEK_BASE_URL,
        api_key=settings.DEEPSEEK_API_KEY,
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

    tool_node = ToolNode(tools)

    builder = StateGraph(AgentState)
    builder.add_node("llm_node", llm_node)
    builder.add_node("tool_node", tool_node)
    builder.add_edge(START, "llm_node")
    builder.add_conditional_edges("llm_node", _route_after_llm)
    builder.add_edge("tool_node", "llm_node")

    _graph = builder.compile(checkpointer=_checkpointer)
    return _graph


def get_graph():
    """Return the singleton compiled agent graph (built during lifespan startup)."""
    return _graph
