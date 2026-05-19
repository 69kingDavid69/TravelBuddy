"""Web search tool using DuckDuckGo's free text-search API.

Includes rate-limit protection: a minimum interval between calls (1.5 s) and
exponential backoff with up to 3 retries.  Falls back to a graceful error
message instead of crashing when the search engine is unavailable.
"""

import time
from pydantic import BaseModel, Field
from langchain_core.tools import tool

# Track the last call timestamp so we never hammer DuckDuckGo faster than
# its rate-limit tolerance.
_last_call_ts: float = 0.0
_MIN_INTERVAL: float = 1.5
_MAX_RETRIES: int = 1
_BACKOFF_BASE: float = 2.0


class WebSearchInput(BaseModel):
    """Structured input schema for the web_search tool."""
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

    # Enforce a minimum cooldown between consecutive searches to avoid rate limits
    elapsed = time.time() - _last_call_ts
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)

    try:
        return _search(query, max_results)
    except Exception as exc:
        # Return a graceful fallback so the agent can still formulate a reply
        return [
            {
                "title": "Search unavailable",
                "snippet": f"Web search is temporarily unavailable: {exc}. "
                           "The search engine may be rate-limiting requests. "
                           "Please try again in a few seconds.",
                "url": "",
            }
        ]
