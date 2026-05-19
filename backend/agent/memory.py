"""Sliding-window memory utility for the agent graph.

Limits the context window to a configurable number of exchange pairs, which
prevents token explosion on long conversations while keeping the system prompt
always present. The window is tool-aware: it never breaks a tool-call sequence
because orphaned ToolMessages violate the LLM API contract.
"""

from langchain_core.messages import SystemMessage, BaseMessage, AIMessage, ToolMessage


def apply_window(
    messages: list[BaseMessage], system_prompt: str, window: int = 7
) -> list[BaseMessage]:
    """Keep roughly the last `window` exchange pairs, always prepending the system prompt.

    The window expands backwards as needed to include the full tool-call
    sequence for any ToolMessage that ends up inside the window.  This
    guarantees every ToolMessage has its preceding AIMessage with tool_calls
    still present.
    """
    non_system = [m for m in messages if not isinstance(m, SystemMessage)]

    # Start with a rough cut: keep the last (window * 2) messages
    start_idx = max(0, len(non_system) - (window * 2))

    # Walk backwards from start_idx looking for orphaned ToolMessages.
    # If we find any, extend the window back far enough to include the
    # AIMessage that owns the initial tool_call.
    for i in range(start_idx, len(non_system)):
        msg = non_system[i]
        if isinstance(msg, ToolMessage) and msg.tool_call_id:
            found_owner = False
            for j in range(i - 1, -1, -1):
                prev = non_system[j]
                if (
                    isinstance(prev, AIMessage)
                    and prev.tool_calls
                    and any(
                        tc.get("id") == msg.tool_call_id for tc in prev.tool_calls
                    )
                ):
                    # Extend window to include the owning AIMessage and
                    # everything after it (including the ToolMessage chain)
                    start_idx = min(start_idx, j)
                    found_owner = True
                    break
            if not found_owner:
                # The tool_call owner is outside the full history.
                # Drop this orphaned ToolMessage — we cannot satisfy the API.
                non_system[i] = None

    windowed = [m for m in non_system[start_idx:] if m is not None]
    return [SystemMessage(content=system_prompt)] + windowed
