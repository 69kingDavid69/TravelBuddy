# TravelBuddy — Bilingual AI Travel Assistant

A multimodal conversational agent with text and voice modes, live tools, RAG retrieval, and bilingual support (English and Spanish).

## Table of contents

- [Quick start](#quick-start)
- [Use case](#use-case)
- [Tools](#tools)
- [System prompt](#system-prompt)
- [RAG pipeline](#rag-pipeline)
- [Voice setup](#voice-setup)
- [API endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Deploy to Fly.io](#deploy-to-flyio)
- [Environment variables](#environment-variables)
- [Acceptance tests](#acceptance-tests)

## Quick start

```bash
# 1. Get the code
git clone https://github.com/69kingDavid69/TravelBuddy.git
cd TravelBuddy

# 2. Configure environment
cp .env.example .env
# Edit .env — set LLM_API_KEY to your Groq key (free at console.groq.com)
# or set DEEPSEEK_API_KEY if you prefer DeepSeek

# 3. Run with Docker (recommended)
docker compose up --build
# Open http://localhost:8080

# 4. Or run locally (no Docker)
pip install -r backend/requirements.txt && pip install piper-tts==1.4.2
cd frontend && npm install && cd ..
# Terminal 1: uvicorn backend.main:app --reload --port 8000
# Terminal 2: cd frontend && npm run dev
# Open http://localhost:5173
```

## LLM providers

TravelBuddy supports any OpenAI-compatible API. Two options:

| Provider | Cost | Sign-up | Recommended model |
|---|---|---|---|
| **Groq** (recommended for demos) | Free tier — 14,400 requests/day | [console.groq.com](https://console.groq.com) | `llama-3.3-70b-versatile` |
| DeepSeek | Paid (~$0.14/M tokens) | [platform.deepseek.com](https://platform.deepseek.com) | `deepseek-chat` |

Set the provider in `.env`:

```bash
# Groq (free)
LLM_API_KEY=gsk_xxxxxxxxxx
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
```

## Use case

TravelBuddy is a bilingual (Spanish/English) AI travel assistant. It answers travel questions, converts currencies with live rates, searches the web for current events and weather, and retrieves destination-specific information from a configured Wikivoyage guide via RAG.

The agent detects the user's language automatically and replies in the same language. Voice mode produces synthesized speech in the matching language (Spanish or English).

## Tools

| Tool | Description | API |
|---|---|---|
| `currency_converter` | Converts between any two currencies using live exchange rates | [open.er-api.com](https://open.er-api.com) (free, no key) |
| `web_search` | Searches the web for current travel info, events, weather, and news | [Tavily](https://tavily.com) (free 1k/month) + Wikipedia fallback |
| `rag_retriever` | Semantic search over the configured Wikivoyage destination guide | ChromaDB (local, embedded) |

The agent uses LangGraph and decides autonomously when to invoke each tool. Tool badges appear in the chat UI for every tool used.

> **Web search implementation note:** `web_search` calls Tavily's REST API (designed for AI agents — no scraping, no rate limits on the free tier). If `TAVILY_API_KEY` is not configured or Tavily fails, the tool transparently falls back to Wikipedia's search API for encyclopedic queries.
>
> Get a free Tavily key at [tavily.com](https://tavily.com) (1,000 searches/month, no credit card). Add it to `.env` as `TAVILY_API_KEY=tvly-...` and restart the backend.

## System prompt

The agent follows 6 rules defined in `backend/prompts/system.md`:

1. **Role and scope** — expert travel assistant, redirects off-topic questions
2. **Tone** — warm, enthusiastic, conversational
3. **Tool usage policy** — uses `currency_converter`, `web_search`, and `rag_retriever` proactively
4. **Restrictions** — no medical, legal, or financial advice; no fabricated numbers
5. **Language behavior** — replies in the user's language (Spanish or English), switches mid-conversation
6. **Voice mode formatting** — plain prose only, no markdown, no URLs

## RAG pipeline

The RAG knowledge base is populated from a Wikivoyage destination guide:

```bash
python -m backend.rag.ingest \
  --url https://en.wikivoyage.org/wiki/Medell%C3%ADn \
  --chroma-dir /data/chroma
```

**How it works:**
1. Fetches the URL with `httpx`
2. Extracts text from `<p>`, `<h1>`-`<h4>`, and `<li>` elements with BeautifulSoup
3. Splits into 800-character chunks with 120-character overlap
4. Embeds with `paraphrase-multilingual-MiniLM-L12-v2` (120MB model, CPU-friendly)
5. Stores in ChromaDB at `/data/chroma`

**Ingested URL:** `https://en.wikivoyage.org/wiki/Medell%C3%ADn`

The agent autonomously calls `rag_retriever` for destination-specific questions.

## Voice setup

Piper TTS is used with two voice models:

| Language | Voice | Size |
|---|---|---|
| Spanish | `es_MX-claude-high` | 63 MB |
| English | `en_US-amy-medium` | 63 MB |

Voice files are stored in `/data/voices/` and downloaded at Docker build time. Language detection uses `langdetect` (seeded, deterministic). The `X-TTS-Voice` response header identifies which voice was used.

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check. Returns `{"status":"ok","model":"deepseek-chat"}` |
| `POST` | `/chat` | Send a message, get agent reply with `tools_used` |
| `POST` | `/tts` | Convert text to speech. Returns `audio/wav` with `X-TTS-Voice` header |

### POST /chat

Request:
```json
{
  "message": "Convert 100 EUR to COP",
  "session_id": "9a1b2c3d-...",
  "mode": "text"
}
```

Response:
```json
{
  "reply": "100 EUR is approximately 441,270 COP...",
  "tools_used": ["currency_converter"],
  "session_id": "9a1b2c3d-..."
}
```

### POST /tts

Request:
```json
{ "text": "Hello, this is a test." }
```

Response: `Content-Type: audio/wav`, `X-TTS-Voice: en_US-amy-medium`

## Architecture

```
Browser (React + Vite + Tailwind)
         │
         ▼ HTTPS
FastAPI (single Docker container on Fly.io)
  ├── /health
  ├── /chat  → LangGraph agent → DeepSeek V4 Flash
  │              ├── currency_converter (open.er-api.com)
  │              ├── web_search (Tavily API + Wikipedia fallback)
  │              └── rag_retriever (ChromaDB local)
  └── /tts   → Piper TTS (bilingual)
                   ├── es_MX-claude-high (Spanish)
                   └── en_US-amy-medium (English)
```

Full architecture document: [`ARCHITECTURE.md`](ARCHITECTURE.md)

## Local development

Follow these steps to go from a fresh clone to a running local instance without Docker (useful for rapid iteration):

```bash
# 1. Clone the repository
git clone <repo-url>
cd voiceagent

# 2. Configure environment
cp .env.example .env
# Open .env in your editor and set DEEPSEEK_API_KEY to your key

# 3. Download Piper binary and voice models (Linux x86_64)
bash scripts/setup_local.sh
# This creates ./data/voices/ with both .onnx and .onnx.json files
# and downloads the Piper binary to ./data/piper/

# 4. Build and start with Docker Compose
docker compose up --build
# On first run this takes a few minutes (builds frontend, installs Python deps,
# downloads the embedding model). Subsequent starts are fast.

# 5. Open the app
# http://localhost:8080

# 6. (Optional) Populate the RAG knowledge base
docker compose exec app python -m backend.rag.ingest \
  --url https://en.wikivoyage.org/wiki/Medell%C3%ADn
```

**Verify the full Section 12 checklist from ARCHITECTURE.md:**

- [ ] Chat interface sends and receives messages in both Spanish and English
- [ ] Mode selector switches between text and voice — voice replies play audio automatically
- [ ] Currency question (e.g. "200 USD en pesos") shows the `currency_converter` badge
- [ ] Web search question (e.g. "events in Medellín this weekend") shows the `web_search` badge
- [ ] Casual question (e.g. "Hello") shows no badge
- [ ] After 8 user turns, the agent no longer remembers content from turn 1
- [ ] After ingesting the RAG URL, a destination-specific question shows the `rag_retriever` badge
- [ ] No API key appears in `git grep -E "sk-|pk_|ek_"` output

**Without Docker (bare Python + Node):**

```bash
# Backend (requires Python 3.11+)
pip install -r backend/requirements.txt
pip install piper-tts==1.4.2
# Add data/piper to your PATH and set PIPER_VOICES_DIR=./data/voices in .env
PIPER_VOICES_DIR=./data/voices uvicorn backend.main:app --reload --port 8000

# Frontend (requires Node 20+)
cd frontend && npm install && npm run dev
# Opens at http://localhost:5173 (proxies /chat and /tts to port 8000)
```

## Deploy to Fly.io

```bash
# Install Fly CLI: https://fly.io/docs/flyctl/install/
fly launch
fly secrets set DEEPSEEK_API_KEY=sk-...
fly deploy
```

Configuration: `fly.toml` — region `mia`, shared-cpu-1x, 1024MB RAM, 1GB persistent volume.

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | Yes | — | API key for DeepSeek |
| `DEEPSEEK_MODEL` | No | `deepseek-chat` | Model name |
| `TAVILY_API_KEY` | No | — | Tavily API key for `web_search` (free 1k/mo at [tavily.com](https://tavily.com)); falls back to Wikipedia if unset |
| `PIPER_VOICE_ES` | No | `es_MX-claude-high` | Spanish Piper voice |
| `PIPER_VOICE_EN` | No | `en_US-amy-medium` | English Piper voice |
| `PIPER_VOICES_DIR` | No | `/data/voices` | Voice files directory |
| `CHROMA_DIR` | No | `/data/chroma` | Vector store path |
| `RAG_SOURCE_URL` | No | — | URL for RAG ingestion |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | CORS origins |
| `MEMORY_WINDOW` | No | `7` | Message pairs in memory |

## Acceptance tests

| Capability | Status |
|---|---|
| Chat interface sends and receives messages | ✅ |
| Mode selector: text and voice modes functional | ✅ |
| Docker / single command to run | ✅ |
| Coherent context over 7 message pairs | ✅ |
| At least 2 tools: `currency_converter` and `web_search` | ✅ |
| Agent decides tool usage autonomously | ✅ |
| System prompt with ≥5 numbered rules | ✅ (6 rules) |
| UI differentiates tool vs direct reply with badges | ✅ |
| Tool indicator persists in conversation history | ✅ |
| Reproducible voice output in Spanish and English | ✅ |
| No API keys in source code or repository | ✅ |
| RAG over a web URL | ✅ |
| All code and documentation in English | ✅ |

## Tech stack

| Layer | Technology |
|---|---|
| LLM | Any OpenAI-compatible provider — Groq (free) or DeepSeek (paid) |
| Agent | LangGraph (ReAct pattern, MemorySaver) |
| Backend | FastAPI + Uvicorn |
| TTS | Piper (piper-tts Python package, bilingual ES/EN) |
| Language detection | `langdetect` |
| Web search | [Tavily](https://tavily.com) REST API (free 1k/mo) with Wikipedia fallback |
| Currency | open.er-api.com (no API key) |
| Vector DB | ChromaDB (embedded) |
| Embeddings | `paraphrase-multilingual-MiniLM-L12-v2` (CPU, multilingual) |
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 — sidebar with session management and delete, tool badges, bilingual UI toggle |
| Container | Docker multi-stage (Node → Python) |
| Deployment | Render (see `render.yaml`) or Fly.io (see `fly.toml`) |
