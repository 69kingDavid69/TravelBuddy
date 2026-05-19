from langchain_core.messages import AIMessage, BaseMessage


def extract_tools_used(new_messages: list[BaseMessage]) -> list[str]:
    """Return the names of all tools called in the given message slice."""
    tools: list[str] = []
    for msg in new_messages:
        if isinstance(msg, AIMessage) and msg.tool_calls:
            for tc in msg.tool_calls:
                tools.append(tc["name"])
    return tools
