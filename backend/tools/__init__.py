"""Tool registry — every callable exposed to the LangGraph agent.

Add new tools to ALL_TOOLS and they will be automatically bound to the LLM
during graph construction.
"""

from backend.tools.currency import currency_converter
from backend.tools.web_search import web_search
from backend.tools.rag_retriever import rag_retriever

ALL_TOOLS = [currency_converter, web_search, rag_retriever]
