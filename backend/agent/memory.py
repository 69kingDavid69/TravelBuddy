"""Sliding-window memory utility for the agent graph.

Limits the context window to a configurable number of exchange pairs, which
prevents token explosion on long conversations while keeping the system prompt
always present.
"""

from langchain_core.messages import SystemMessage, BaseMessage


def apply_window(messages: list[BaseMessage], system_prompt: str, window: int = 7) -> list[BaseMessage]:
    """Keep only the last `window` pairs of messages, always prepending the system prompt.

    Each "pair" is a HumanMessage + AIMessage exchange, so window*2 individual
    messages are retained.  The system prompt is stripped from history and
    re-injected at position 0 so it is never lost.
    """
    non_system = [m for m in messages if not isinstance(m, SystemMessage)]
    windowed = non_system[-(window * 2):]
    return [SystemMessage(content=system_prompt)] + windowed
