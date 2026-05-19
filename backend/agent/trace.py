"""Observability utility for extracting tool-call metadata from agent messages."""

from langchain_core.messages import AIMessage, BaseMessage


def extract_tools_used(new_messages: list[BaseMessage]) -> list[str]:
    """Return the names of all tools called in the given message slice.

    Useful for surfacing which tools the agent invoked on a particular turn,
    e.g. to display tool-use indicators in the frontend.
    """
    tools: list[str] = []
    for msg in new_messages:
        if isinstance(msg, AIMessage) and msg.tool_calls:
            for tc in msg.tool_calls:
                tools.append(tc["name"])
    return tools
