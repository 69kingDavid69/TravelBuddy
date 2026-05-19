from typing import Literal
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    session_id: str
    mode: Literal["text", "voice"] = "text"


class ChatResponse(BaseModel):
    reply: str
    tools_used: list[str]
    session_id: str


class TTSRequest(BaseModel):
    text: str


class HealthResponse(BaseModel):
    status: str
    model: str
