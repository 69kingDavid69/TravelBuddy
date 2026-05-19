"""Web search tool.

Primary provider: Tavily (https://tavily.com) — free 1k searches/month, designed
for AI agents, no scraping involved.

Fallback: Wikipedia search API — always available, no key, but only useful for
encyclopedic queries (cities, attractions, history). Used when Tavily is not
configured or returns nothing.
"""

import re
import time

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from backend.settings import settings

_TAVILY_URL = "https://api.tavily.com/search"
_WIKI_API = "https://en.wikipedia.org/w/api.php"
_MIN_INTERVAL: float = 1.0

_last_call: float = 0.0


class WebSearchInput(BaseModel):
    """Structured input schema for the web_search tool."""
    query: str = Field(description="Search query string")
    max_results: int = Field(default=5, description="Maximum number of results to return")


def _throttle() -> None:
    """Enforce a minimum interval between outbound search requests.

    Prevents accidental burst-calling from hitting provider rate limits,
    especially relevant for the free-tier Tavily plan.
    """
    global _last_call
    elapsed = time.time() - _last_call
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)
    _last_call = time.time()


def _fetch_tavily(query: str, max_results: int) -> list[dict]:
    """Call Tavily's REST API. Returns [] if no key is configured."""
    api_key = settings.TAVILY_API_KEY
    if not api_key:
        return []

    resp = httpx.post(
        _TAVILY_URL,
        json={
            "api_key": api_key,
            "query": query,
            "max_results": max_results,
            "search_depth": "basic",
            "include_answer": False,
        },
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json()
    results = []
    for r in data.get("results", []):
        results.append({
            "title": r.get("title", ""),
            "snippet": r.get("content", ""),
            "url": r.get("url", ""),
        })
    return results


def _fetch_wikipedia(query: str, max_results: int) -> list[dict]:
    """Query the Wikipedia opensearch API as a zero-config fallback provider.

    Strips HTML tags from snippets so the agent receives clean text.
    """
    resp = httpx.get(
        _WIKI_API,
        params={
            "action": "query",
            "list": "search",
            "srsearch": query,
            "format": "json",
            "srlimit": max_results,
            "srprop": "snippet",
        },
        timeout=10,
        headers={"User-Agent": "TravelBuddy/1.0 (travel assistant)"},
    )
    resp.raise_for_status()
    data = resp.json()
    results = []
    tag = re.compile(r"<[^>]+>")
    for hit in data.get("query", {}).get("search", []):
        results.append({
            "title": hit.get("title", ""),
            "snippet": tag.sub("", hit.get("snippet", "")),
            "url": f"https://en.wikipedia.org/wiki/{hit.get('title','').replace(' ', '_')}",
        })
    return results


@tool("web_search", args_schema=WebSearchInput)
def web_search(query: str, max_results: int = 5) -> list[dict]:
    """Search the web for current travel information, events, weather, prices, and news."""
    _throttle()

    try:
        results = _fetch_tavily(query, max_results)
        if results:
            return results
    except Exception as err:
        # Tavily failed — fall through to Wikipedia
        wiki = _fetch_wikipedia(query, max_results)
        if wiki:
            return wiki
        return [{"title": "Search unavailable", "snippet": f"Web search failed: {err}", "url": ""}]

    # Tavily not configured or returned empty — try Wikipedia
    wiki = _fetch_wikipedia(query, max_results)
    if wiki:
        return wiki
    return [{"title": "No results found", "snippet": f"No web results for: {query}", "url": ""}]
