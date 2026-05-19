# VoiceAgent — Multimodal Conversational Agent with Web App

**TravelBuddy** — a bilingual AI travel assistant with text and voice modes, live tools, and RAG over a destination guide.

## Quick start

```bash
# 1. Set your API key
cp .env.example .env
# Edit .env and set DEEPSEEK_API_KEY=sk-...

# 2. Run with Docker
docker compose up --build
# Open http://localhost:8080

# Or run locally
cd backend && pip install -r requirements.txt && pip install piper-tts==1.4.2
cd ../frontend && npm install
# Terminal 1: uvicorn backend.main:app --reload --port 8000
# Terminal 2: npm run dev
# Open http://localhost:5173
```

## Deploy

```bash
fly launch
fly secrets set DEEPSEEK_API_KEY=sk-...
fly deploy
```

## Use case

TravelBuddy helps users plan trips in Spanish or English. It answers travel questions, converts currencies with live rates, searches the web for current events and weather, and retrieves information from a configured destination guide via RAG.

## Tools

| Tool | Description | External API |
|---|---|---|
| `currency_converter` | Live exchange rates between any two currencies | open.er-api.com (no key) |
| `web_search` | Current travel info, events, weather, news | DuckDuckGo (no key) |
| `rag_retriever` | Semantic search over the configured destination guide | ChromaDB (local) |

## RAG pipeline

The RAG knowledge base is populated from a Wikivoyage destination guide.

```bash
# Ingest the destination guide
python -m backend.rag.ingest --url https://en.wikivoyage.org/wiki/Medell%C3%ADn --chroma-dir /data/chroma
```

The agent autonomously calls `rag_retriever` when the user asks about topics covered in the ingested URL.

## Environment variables

See `.env.example` for all variables. The only required variable is `DEEPSEEK_API_KEY`.
