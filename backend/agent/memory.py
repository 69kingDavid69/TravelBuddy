from langchain_core.messages import SystemMessage, BaseMessage


def apply_window(messages: list[BaseMessage], system_prompt: str, window: int = 7) -> list[BaseMessage]:
    """Keep only the last `window` pairs of messages, always prepending the system prompt."""
    non_system = [m for m in messages if not isinstance(m, SystemMessage)]
    windowed = non_system[-(window * 2):]
    return [SystemMessage(content=system_prompt)] + windowed
