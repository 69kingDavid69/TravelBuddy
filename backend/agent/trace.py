"""Observability utility for extracting tool-call metadata from agent messages."""

from langchain_core.messages import AIMessage, BaseMessage


def extract_tools_used(new_messages: list[BaseMessage]) -> list[str]:
    """Return the unique tool names called this turn, preserving first-seen order."""
    seen: set[str] = set()
    tools: list[str] = []
    for msg in new_messages:
        if isinstance(msg, AIMessage) and msg.tool_calls:
            for tc in msg.tool_calls:
                name = tc["name"]
                if name not in seen:
                    seen.add(name)
                    tools.append(name)
    return tools
