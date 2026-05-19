"""FastAPI application entry point for the TravelBuddy backend.

Provides the REST API surface: health check, chat (LangGraph agent), TTS synthesis,
and static file serving for the frontend SPA.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from langchain_core.messages import AIMessage, HumanMessage

from backend.agent.graph import build_graph, get_graph
from backend.agent.trace import extract_tools_used
from backend.schemas import ChatRequest, ChatResponse, HealthResponse, TTSRequest
from backend.settings import settings
from backend.tools import ALL_TOOLS

_SYSTEM_PROMPT_PATH = Path(__file__).parent / "prompts" / "system.md"
_system_prompt: str = ""


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the system prompt and build the LangGraph agent on startup."""
    global _system_prompt
    _system_prompt = _SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
    build_graph(ALL_TOOLS, _system_prompt)
    yield


app = FastAPI(title="TravelBuddy API", version="1.0.0", lifespan=lifespan)

# CORS is configured from env vars so the frontend dev server can call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health():
    """Return service health status and the active LLM model."""
    return {"status": "ok", "model": settings.DEEPSEEK_MODEL}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle a chat message through the LangGraph agent.

    Computes only the *new* messages returned since the previous state snapshot
    so the client gets an incremental reply.
    """
    graph = get_graph()
    config = {
        "configurable": {
            "thread_id": request.session_id,
            "mode": request.mode,
        }
    }

    try:
        # Snapshot the message count *before* this turn so we can isolate new messages
        prev_state = await graph.aget_state(config)
        prev_count = (
            len(prev_state.values.get("messages", []))
            if prev_state and prev_state.values
            else 0
        )

        result = await graph.ainvoke(
            {"messages": [HumanMessage(content=request.message)]},
            config,
        )

        new_messages = result["messages"][prev_count:]
        tools_used = extract_tools_used(new_messages)

        # Walk backwards to find the last assistant reply with actual content
        reply = ""
        for msg in reversed(new_messages):
            if isinstance(msg, AIMessage) and msg.content:
                reply = str(msg.content)
                break

        return ChatResponse(reply=reply, tools_used=tools_used, session_id=request.session_id)

    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Agent error: {exc}") from exc


@app.post("/tts")
async def tts(request: TTSRequest):
    """Synthesize text to speech via Piper TTS and return WAV audio."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        # Lazy-import so Piper is only required when /tts is actually called
        from backend.tts.piper_client import synthesize

        wav_bytes, voice = synthesize(request.text)
        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={"X-TTS-Voice": voice},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"TTS error: {exc}") from exc


# Static files mount — must come last so API routes take priority
_static_dir = Path(__file__).parent / "static"
if _static_dir.exists():
    app.mount("/", StaticFiles(directory=str(_static_dir), html=True), name="static")
