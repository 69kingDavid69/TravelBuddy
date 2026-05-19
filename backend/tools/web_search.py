import time
from pydantic import BaseModel, Field
from langchain_core.tools import tool

_last_call_ts: float = 0.0
_MIN_INTERVAL: float = 1.5
_MAX_RETRIES: int = 3
_BACKOFF_BASE: float = 3.0


class WebSearchInput(BaseModel):
    query: str = Field(description="Search query string")
    max_results: int = Field(default=5, description="Maximum number of results to return")


def _search(query: str, max_results: int) -> list[dict]:
    """Internal search with exponential backoff for rate limits."""
    global _last_call_ts
    from duckduckgo_search import DDGS
    from duckduckgo_search.exceptions import RatelimitException

    last_exc = None
    for attempt in range(_MAX_RETRIES):
        try:
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
        except RatelimitException as exc:
            last_exc = exc
            wait = _BACKOFF_BASE * (2 ** attempt)
            time.sleep(wait)
        except Exception as exc:
            last_exc = exc
            if attempt < _MAX_RETRIES - 1:
                time.sleep(_BACKOFF_BASE * (2 ** attempt))
            else:
                raise

    raise last_exc or RuntimeError("Web search failed after retries")


@tool("web_search", args_schema=WebSearchInput)
def web_search(query: str, max_results: int = 5) -> list[dict]:
    """Search the web for current travel information, events, weather, prices, and news using DuckDuckGo."""
    global _last_call_ts

    elapsed = time.time() - _last_call_ts
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)

    try:
        return _search(query, max_results)
    except Exception as exc:
        return [
            {
                "title": "Search unavailable",
                "snippet": f"Web search is temporarily unavailable: {exc}. "
                           "The search engine may be rate-limiting requests. "
                           "Please try again in a few seconds.",
                "url": "",
            }
        ]
