"""Pydantic request/response models for the TravelBuddy API."""

from typing import Literal
from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Payload for POST /chat — a single-turn message with session tracking."""
    message: str
    session_id: str
    mode: Literal["text", "voice"] = "text"


class ChatResponse(BaseModel):
    """Response from /chat — the agent's reply plus metadata about tool usage."""
    reply: str
    tools_used: list[str]
    session_id: str


class TTSRequest(BaseModel):
    """Payload for POST /tts — plain text to be synthesized to speech."""
    text: str


class HealthResponse(BaseModel):
    """Response from GET /health — indicates the service and model are reachable."""
    status: str
    model: str
