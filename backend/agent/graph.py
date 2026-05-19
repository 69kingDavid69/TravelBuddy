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
    messages: Annotated[list[BaseMessage], add_messages]


_checkpointer = MemorySaver()
_graph = None


def _route_after_llm(state: AgentState) -> str:
    last_msg = state["messages"][-1]
    if isinstance(last_msg, AIMessage) and last_msg.tool_calls:
        return "tool_node"
    return END


def build_graph(tools: list, system_prompt: str):
    global _graph

    llm = ChatOpenAI(
        model=settings.DEEPSEEK_MODEL,
        base_url=settings.DEEPSEEK_BASE_URL,
        api_key=settings.DEEPSEEK_API_KEY,
        temperature=0.2,
    )
    llm_with_tools = llm.bind_tools(tools)

    def llm_node(state: AgentState, config: RunnableConfig):
        mode = config.get("configurable", {}).get("mode", "text")
        effective_prompt = system_prompt
        if mode == "voice":
            effective_prompt += (
                "\n\nCURRENT MODE: voice — use plain prose only. "
                "No markdown, no bullet lists, no asterisks, no URLs."
            )
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
    return _graph
