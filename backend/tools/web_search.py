import time
from pydantic import BaseModel, Field
from langchain_core.tools import tool

_last_call_ts: float = 0.0
_MIN_INTERVAL: float = 1.0


class WebSearchInput(BaseModel):
    query: str = Field(description="Search query string")
    max_results: int = Field(default=5, description="Maximum number of results to return")


@tool("web_search", args_schema=WebSearchInput)
def web_search(query: str, max_results: int = 5) -> list[dict]:
    """Search the web for current travel information, events, weather, prices, and news using DuckDuckGo."""
    global _last_call_ts
    from duckduckgo_search import DDGS

    elapsed = time.time() - _last_call_ts
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)

    try:
        with DDGS() as ddgs:
            raw = list(ddgs.text(query, max_results=max_results))
        _last_call_ts = time.time()
    except Exception:
        time.sleep(2.0)
        with DDGS() as ddgs:
            raw = list(ddgs.text(query, max_results=max_results))
        _last_call_ts = time.time()

    return [
        {
            "title": r.get("title", ""),
            "snippet": r.get("body", ""),
            "url": r.get("href", ""),
        }
        for r in raw
    ]
