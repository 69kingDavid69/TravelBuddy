# VoiceAgent — Architecture and Modular Construction Plan

**Project:** Multimodal Conversational Agent with Web App
**Module:** AI Automation 2026
**Status:** Pre-implementation specification
**Document language:** English (all project documentation, code, and identifiers MUST be in English)

---

## 1. Purpose of this document

This document defines the architecture of VoiceAgent and the order in which it will be built. The system is decomposed into self-contained blocks. Each block ships a vertical slice of functionality and has explicit acceptance tests. The next block is only started after the current one is verified to work end to end.

Two readers are expected:

- The implementer, who builds the system block by block.
- The evaluator, who verifies the deliverable against the rubric in Section 12.

### 1.1 Documentation and language policy

The entire project MUST be written in English. This is a hard requirement of the rubric and applies to every artifact produced during the build:

- All source code: identifiers (variables, functions, classes, modules, files, directories), inline comments, and docstrings.
- All Markdown files in the repository, including `README.md` and `ARCHITECTURE.md`.
- Git commit messages and pull request descriptions.
- The system prompt and every tool name, description, and parameter exposed to the LLM.
- `.env.example` keys and any inline configuration comments.
- Every user-facing string rendered by the frontend: UI labels, error messages, placeholders, button text, badge captions.
- Log messages and exception text in the backend.

Spanish (or any other language) is permitted only in two narrow places:

- The end user's natural-language input to the chat. The agent replies in the same language the user wrote in.
- Third-party identifiers that happen to contain Spanish tokens, such as the Piper voice model name `es_MX-claude-high`.

A pre-submission language audit is included in Section 12. The README itself is in English and is the entry point for the evaluator; if anything outside the two exceptions above is found in Spanish, the build is not ready to submit.

### 1.2 Scope and grading target

This project targets the maximum possible score on the rubric. Every requirement in the source specification, including the section labeled "Puntos Extra" (RAG over a URL), is treated as mandatory in this build. The RAG pipeline is therefore a first-class component of the architecture, not an optional extension. It has the same status as the two required tools, the memory window, and the TTS layer.

---

## 2. Use case

**TravelBuddy** — a bilingual AI travel assistant. The user asks travel-related questions in text or voice, in Spanish or English, and the agent responds in the same language using real tools when current information or computation is required.

Capabilities:

- Answer general travel questions from the LLM's own knowledge in Spanish or English.
- Convert currencies on demand using a live exchange-rate API.
- Search the web for current information (events, weather, opening hours, news).
- Retrieve information from a configured destination-guide URL via a RAG pipeline (required scope).
- Respond in voice when voice mode is selected, with the synthesized speech in the same language the user wrote in.

The agent must reply in the same language the user wrote in, and the TTS layer must produce speech in that same language. Bilingual (Spanish and English) is a hard requirement of this build.

---

## 3. High-level architecture

```
+------------------------------------------------------------------------+
|                          BROWSER (Client)                              |
|                                                                        |
|  Frontend: React + Vite + Tailwind                                    |
|  ChatWindow | ModeSelector | ToolBadge | InputBar | AudioPlayer       |
+--------------------------------+---------------------------------------+
                                 |
                                 |  HTTPS (fetch)
                                 v
+------------------------------------------------------------------------+
|                FLY.IO APPLICATION  (single Docker container)           |
|                                                                        |
|  FastAPI / Uvicorn                                                    |
|   - GET  /              -> serves React build (static)                |
|   - POST /chat          -> LangGraph agent                            |
|   - POST /tts           -> Piper TTS                                  |
|   - GET  /health        -> liveness                                   |
|                                                                        |
|  Agent layer (LangGraph)                                              |
|   - System prompt (>=5 rules)                                         |
|   - MemorySaver scoped by session_id, windowed to last 7 messages     |
|   - LLM node  -->  DeepSeek V4 Flash (OpenAI-compatible)              |
|   - Tool node                                                         |
|       * currency_converter      (open.er-api.com, no key)             |
|       * web_search              (duckduckgo-search, no key)           |
|       * rag_retriever           (ChromaDB local)                      |
|   - Trace collector emits tools_used[] in every response              |
|                                                                        |
|  TTS layer (bilingual)                                                |
|   - Language detection (langdetect) on the input text                 |
|   - Piper binary with two voices loaded:                              |
|       * es_MX-claude-high.onnx  (Spanish)                             |
|       * en_US-amy-medium.onnx   (English)                             |
|   - Invoked as subprocess, returns audio/wav                          |
|                                                                        |
|  Persistent volume: /data                                             |
|   - /data/chroma/        (vector store)                               |
|   - /data/voices/        (downloaded Piper voices)                    |
+------------------------------------------------------------------------+
              |                                  |
              v                                  v
   +--------------------+              +--------------------+
   |   DeepSeek API     |              |   DuckDuckGo       |
   |   (paid)           |              |   open.er-api.com  |
   +--------------------+              +--------------------+
```

A single container holds backend, frontend, agent, and TTS. The only paid external dependency is the DeepSeek API.

---

## 4. Technology stack

| Layer | Choice | Rationale |
|---|---|---|
| LLM | DeepSeek V4 Flash (`deepseek-chat`) | OpenAI-compatible, supports tool calls, lowest cost per token, sufficient quality |
| Agent framework | LangGraph | Native streaming of tool events, clean separation of LLM/tool nodes, durable checkpointer for session memory |
| Backend | FastAPI + Uvicorn | Async, Pydantic validation, single-file simplicity |
| TTS | Piper (rhasspy/piper) | CPU-only neural TTS, voices available for Spanish and English, runs in shared-cpu Fly machines |
| Language detection | `langdetect` | Tiny (~1MB), no model download, fast, returns ISO codes; used to pick the Piper voice |
| Web search | `duckduckgo-search` | No API key, free, sufficient for evaluator demos |
| Currency | open.er-api.com | No API key, free, simple JSON |
| Vector DB | ChromaDB embedded | No external service, persists to a file |
| Embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | Multilingual, CPU-friendly, ~120MB |
| Web scraper | `httpx` + `beautifulsoup4` | Standard, no JavaScript rendering needed |
| Frontend | React + Vite + Tailwind | Fast dev loop, minimal CSS effort for the tool indicator |
| Container | Docker multi-stage | One image, one deploy command |
| Hosting | Fly.io | Single-command deploy, Docker-native, volumes, auto-stop |

Every component is open source. DeepSeek is the only paid dependency.

---

## 5. Component design

### 5.1 Frontend

Single-page React app built with Vite. Tailwind for styling. No state management library; React hooks are sufficient for this scope.

Components:

- `ChatWindow` — scrollable message list.
- `MessageBubble` — renders one message; if `tools_used` is non-empty it shows a `ToolBadge` for each tool above the text.
- `ToolBadge` — colored pill with the tool name; persists in history, not just during loading.
- `ModeSelector` — radio buttons: `text` or `voice`. Default `text`.
- `InputBar` — text input + send button. Disabled while a request is in flight.
- `AudioPlayer` — wraps an HTML5 `<audio>` element; receives a blob URL.

State shape (single source of truth in `App.jsx`):

```
{
  sessionId: string,         // crypto.randomUUID() persisted to localStorage
  mode: "text" | "voice",
  messages: [
    {
      id: string,
      role: "user" | "assistant",
      content: string,
      tools_used: string[],   // empty for direct replies and for user messages
      audio_url: string|null  // populated only when mode === "voice"
    }
  ],
  isLoading: boolean
}
```

Networking is in `src/api.js` — two functions: `postChat({message, mode, sessionId})` and `postTTS({text})`. The frontend never talks to DeepSeek directly.

### 5.2 Backend

FastAPI app exposing the four endpoints listed in Section 8. CORS is permissive in development (`http://localhost:5173`) and restricted to the deployed origin in production.

Single configuration object loaded from environment variables at startup. No secrets in code.

Static files (the React build) are mounted at `/` so a single Fly app serves everything.

### 5.3 Agent

LangGraph state machine with the standard ReAct-style topology:

```
START -> llm_node -> (tool_calls?) -> tool_node -> llm_node -> END
```

Key implementation points:

- `MemorySaver` checkpointer keyed by `thread_id = session_id`.
- Before invoking the LLM, the message list is sliced to the **last 14 entries** (7 user + 7 assistant pairs). The system prompt is always prepended and is not counted in the window.
- The system prompt lives in `backend/prompts/system.md` and is loaded once at startup. It contains at least five numbered rules covering role, tone, tool-usage policy, restrictions, bilingual language behavior (reply in the user's language, Spanish or English), and voice-mode formatting (avoid markdown, emojis, and long URLs because they degrade TTS quality).
- A trace collector subscribes to LangGraph's event stream and collects the names of every tool that fired during the turn. This list is returned as `tools_used` in the response.

LLM wiring:

```python
ChatOpenAI(
    model="deepseek-chat",
    base_url="https://api.deepseek.com/v1",
    api_key=settings.DEEPSEEK_API_KEY,
    temperature=0.2,
)
```

The aliases `deepseek-chat` and `deepseek-reasoner` are scheduled for deprecation in mid-2026. The model name is centralized in `settings.py` so it can be switched to `deepseek-v4-flash` with one change.

### 5.4 Tools

Every tool is a LangChain `@tool` with a Pydantic args schema. The agent decides autonomously when to call each one; tool selection is not hardcoded.

**Tool 1 — `currency_converter`**

- Args: `amount: float`, `from_currency: str (ISO 4217)`, `to_currency: str (ISO 4217)`.
- Implementation: GET `https://open.er-api.com/v6/latest/{from_currency}`, multiply by `rates[to_currency]`.
- Returns: `{converted: float, rate: float, source: "open.er-api.com"}`.

**Tool 2 — `web_search`**

- Args: `query: str`, `max_results: int = 5`.
- Implementation: `duckduckgo_search.DDGS().text(...)`.
- Returns: list of `{title, snippet, url}`.
- Rate-limit protection: a 1-second floor between consecutive calls, retried once on `RatelimitException`.

**Tool 3 — `rag_retriever`**

- Args: `query: str`, `k: int = 4`.
- Implementation: similarity search against the local Chroma collection populated by `ingest.py`.
- Returns: list of `{chunk, source_url, score}`.

### 5.5 TTS

The TTS layer is bilingual. The same `/tts` endpoint serves both languages and chooses the voice automatically based on the text content.

Pipeline:

1. The endpoint receives `text` from the frontend.
2. Strip markdown and URLs (voice mode produces poor audio for these).
3. Detect language with `langdetect.detect(text)`. The detector is seeded for deterministic output (`DetectorFactory.seed = 0`).
4. Select the voice:
   - `en` returns the English voice (`PIPER_VOICE_EN`, default `en_US-amy-medium`).
   - Anything else, or detection failure, returns the Spanish voice (`PIPER_VOICE_ES`, default `es_MX-claude-high`). Spanish is the safe default for the use case.
5. Invoke `piper --model /data/voices/<voice>.onnx` as a subprocess and pipe the text in.
6. Return the raw WAV bytes as `audio/wav`, with a custom response header `X-TTS-Voice: <voice>` for debuggability.

Implementation lives in `backend/tts/piper_client.py`. The language-selection helper is a small pure function `select_voice(text: str) -> str` that is unit-testable independently of Piper.

Both voice models are downloaded at image-build time and stored under `/data/voices/` on the Fly volume so cold starts do not re-download them. Total disk cost: roughly 110 MB for the two voices.

The frontend does not pass a language hint. Detection is centralized in the backend so the frontend remains language-agnostic.

### 5.6 RAG pipeline

Two pieces:

- **Ingestion** (one-off script `backend/rag/ingest.py`):
  1. Fetch the URL with `httpx`.
  2. Parse with BeautifulSoup, extract main text.
  3. Split with `RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)`.
  4. Embed with the multilingual MiniLM model.
  5. Upsert into Chroma at `/data/chroma/`.

  Run with: `python -m backend.rag.ingest --url https://...`.

- **Retrieval** (tool `rag_retriever`): exposed to the agent. The system prompt instructs the agent to call it for questions about the configured destination.

The source URL and the ingest command are documented in the README so the evaluator can reproduce.

### 5.7 Deployment

Fly.io with a single app and a single 1GB volume.

- `fly.toml` declares region `mia` (low latency from Colombia), shared-cpu-1x, 1024MB RAM.
- `auto_stop_machines = "stop"` and `min_machines_running = 0` to minimize cost when idle.
- `DEEPSEEK_API_KEY` is set with `fly secrets set`. Never present in the image or repo.
- Volume `data` mounted at `/data`.

Local development uses Docker Compose mirroring the Fly setup so behavior is identical.

---

## 6. Project structure

```
firstname-lastname-voiceagent/
|-- README.md                       # English; setup, run, tools, use case, RAG URL
|-- ARCHITECTURE.md                 # this document
|-- .env.example
|-- .gitignore
|-- Dockerfile                      # multi-stage: frontend build + backend runtime
|-- docker-compose.yml              # local dev parity with Fly
|-- fly.toml
|
|-- backend/
|   |-- main.py                     # FastAPI app, route registration, static mount
|   |-- settings.py                 # env-driven config
|   |-- schemas.py                  # Pydantic request/response models
|   |-- agent/
|   |   |-- __init__.py
|   |   |-- graph.py                # build_graph(): LangGraph compilation
|   |   |-- memory.py               # MemorySaver + window helper
|   |   `-- trace.py                # tools_used collector
|   |-- prompts/
|   |   `-- system.md               # >=5 numbered rules
|   |-- tools/
|   |   |-- __init__.py             # registry of all @tool functions
|   |   |-- currency.py
|   |   |-- web_search.py
|   |   `-- rag_retriever.py
|   |-- tts/
|   |   |-- __init__.py
|   |   `-- piper_client.py         # subprocess wrapper
|   |-- rag/
|   |   |-- __init__.py
|   |   `-- ingest.py
|   |-- static/                     # populated by Docker stage from frontend build
|   `-- requirements.txt
|
`-- frontend/
    |-- package.json
    |-- vite.config.js
    |-- tailwind.config.js
    |-- index.html
    `-- src/
        |-- main.jsx
        |-- App.jsx
        |-- api.js
        |-- hooks/
        |   `-- useChat.js
        |-- components/
        |   |-- ChatWindow.jsx
        |   |-- MessageBubble.jsx
        |   |-- ToolBadge.jsx
        |   |-- ModeSelector.jsx
        |   |-- InputBar.jsx
        |   `-- AudioPlayer.jsx
        `-- index.css
```

---

## 7. Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | yes | — | API key for DeepSeek. Set with `fly secrets set` in production. |
| `DEEPSEEK_MODEL` | no | `deepseek-chat` | Override the model name. Switch to `deepseek-v4-flash` before alias deprecation. |
| `PIPER_VOICE_ES` | no | `es_MX-claude-high` | Spanish Piper ONNX voice model filename (without extension). |
| `PIPER_VOICE_EN` | no | `en_US-amy-medium` | English Piper ONNX voice model filename (without extension). |
| `PIPER_VOICES_DIR` | no | `/data/voices` | Where voice files are stored. |
| `CHROMA_DIR` | no | `/data/chroma` | Vector store path. |
| `RAG_SOURCE_URL` | yes | — | URL ingested by the RAG pipeline. Documented in README. |
| `ALLOWED_ORIGINS` | no | `http://localhost:5173` | Comma-separated CORS origins. |
| `MEMORY_WINDOW` | no | `7` | Number of message pairs kept in memory. |

`.env.example` ships in the repo with every key listed and no real values. No secrets are hardcoded anywhere in the codebase.

---

## 8. API contracts

### 8.1 POST /chat

Request:
```json
{
  "message": "How much is 200 USD in COP?",
  "session_id": "9a1b2c3d-...",
  "mode": "text"
}
```

Response (200):
```json
{
  "reply": "200 USD is approximately 812,400 COP at today's rate.",
  "tools_used": ["currency_converter"],
  "session_id": "9a1b2c3d-..."
}
```

Errors: 400 (bad input), 502 (upstream LLM error), 500 (internal).

### 8.2 POST /tts

Request:
```json
{ "text": "Two hundred US dollars is approximately eight hundred twelve thousand four hundred Colombian pesos." }
```

Response (200): `Content-Type: audio/wav`, body = raw WAV bytes.

Errors: 400 (empty text), 500 (Piper failure).

### 8.3 GET /health

Response (200): `{"status": "ok", "model": "deepseek-chat"}`.

---

## 9. Data flow — voice-mode turn

```
1. User selects mode = voice and types "Currency for 200 USD in COP?"
2. Frontend POST /chat { message, session_id, mode: "voice" }
3. Backend loads thread by session_id, applies 7-message window
4. LangGraph LLM node receives system prompt + windowed history + new message
5. LLM emits a tool_call for currency_converter(200, "USD", "COP")
6. Tool node executes, returns {converted: 812400, rate: 4062, source: "..."}
7. Trace collector records "currency_converter"
8. LLM node composes natural-language reply using the tool result
9. Backend returns { reply, tools_used: ["currency_converter"], session_id }
10. Frontend renders the assistant message with a ToolBadge "currency_converter"
11. Because mode === "voice", frontend POST /tts { text: reply }
12. Backend pipes text through Piper, returns audio/wav bytes
13. Frontend creates a blob URL and the AudioPlayer plays it
```

A text-mode turn is identical except steps 11-13 are skipped.

---

## 10. Construction plan

The system is built in twelve blocks. Each block has:

- A goal that produces visible, testable behavior.
- A list of files touched.
- An acceptance test that must pass before moving on.
- An estimated effort tag (S/M/L) to help with pacing.

Do not start a block until the previous one passes its test. Commit after each block.

---

### Block 0 — Repository scaffolding (S)

**Goal:** Create the directory layout, `.env.example`, `.gitignore`, empty `README.md` with a one-line description, `requirements.txt` with pinned versions, and an empty `frontend/package.json` skeleton from `npm create vite@latest`.

**Files touched:** root level only; no business logic.

**Acceptance test:**
- `tree -L 2` matches Section 6 (empty files allowed).
- `git status` shows a clean initial commit.

---

### Block 1 — Backend health endpoint (S)

**Goal:** A minimal FastAPI app with CORS configured and a `GET /health` endpoint.

**Files touched:** `backend/main.py`, `backend/settings.py`, `backend/requirements.txt`.

**Acceptance test:**
- `uvicorn backend.main:app --reload` starts without error.
- `curl http://localhost:8000/health` returns `{"status":"ok","model":"<model>"}`.

---

### Block 2 — DeepSeek chat without agent or memory (M)

**Goal:** `POST /chat` accepts a message, forwards it to DeepSeek via `ChatOpenAI`, and returns the reply. No tools, no memory, no system prompt yet.

**Files touched:** `backend/main.py`, `backend/schemas.py`, `backend/settings.py` (add `DEEPSEEK_API_KEY`).

**Acceptance test:**
- `curl -X POST localhost:8000/chat -d '{"message":"Hello","session_id":"test","mode":"text"}'` returns a coherent reply.
- Killing the key in `.env` produces a clean 502, not a stack trace to the client.

---

### Block 3 — System prompt and session memory (M)

**Goal:** Add `backend/prompts/system.md` with at least five numbered rules. Wire `MemorySaver` keyed by `session_id`. Enforce the 7-message window before invoking the LLM.

**Files touched:** `backend/prompts/system.md`, `backend/agent/memory.py`, `backend/main.py`.

**Acceptance test:**
- Three consecutive `/chat` calls with the same `session_id`: tell the agent your name in turn 1, ask "what is my name?" in turn 3. Expected: the agent answers correctly.
- Same conversation with a different `session_id`: the agent does not know the name. Expected: it says so.
- After 8 user turns, the first turn falls out of the window: the agent no longer remembers content from turn 1.

---

### Block 4 — LangGraph agent with two tools (L)

**Goal:** Replace the flat chat call with a compiled LangGraph. Register `currency_converter` and `web_search` as tools. Implement the trace collector and return `tools_used` in the response.

**Files touched:** `backend/agent/graph.py`, `backend/agent/trace.py`, `backend/tools/__init__.py`, `backend/tools/currency.py`, `backend/tools/web_search.py`, `backend/main.py`, `backend/schemas.py`.

**Acceptance test:**
- "Convert 100 EUR to COP": response includes `tools_used: ["currency_converter"]` and a sensible number.
- "What is happening in Medellin this weekend?": response includes `tools_used: ["web_search"]`.
- "Hi, how are you?": response has `tools_used: []`.
- Memory from Block 3 still works (regression check).

---

### Block 5 — Piper bilingual TTS endpoint (M)

**Goal:** Local installation of Piper plus the Spanish and English voices. Implement `POST /tts` with automatic language detection that returns a playable WAV synthesized in the matching language.

**Files touched:** `backend/tts/piper_client.py` (with `select_voice` helper), `backend/main.py`, `backend/schemas.py`, `backend/requirements.txt` (add `langdetect`). Local-only: a `scripts/setup_piper.sh` is acceptable for the local environment; the Dockerfile will handle voice download in Block 9.

**Acceptance test:**
- `curl -X POST localhost:8000/tts -d '{"text":"Hola, esto es una prueba."}' -o test_es.wav` produces audible Spanish.
- `curl -X POST localhost:8000/tts -d '{"text":"Hello, this is a test."}' -o test_en.wav` produces audible English with a native-sounding accent.
- Response header `X-TTS-Voice` reflects the selected voice in each case.
- A unit test for `select_voice` covers: Spanish text returns the Spanish voice, English text returns the English voice, and an empty or detection-failing input falls back to Spanish without raising.

---

### Block 6 — Frontend chat UI, text mode only (L)

**Goal:** Working React UI: ChatWindow, MessageBubble, InputBar, and a hardcoded text mode. Session ID is generated on first load and stored in `localStorage`.

**Files touched:** everything under `frontend/src/`.

**Acceptance test:**
- `npm run dev` opens the app at `localhost:5173`.
- Sending a message produces an assistant reply in the chat.
- Refreshing the page keeps the same `session_id` and the conversation memory still works against the backend.

---

### Block 7 — Tool-use indicator in the UI (S)

**Goal:** `ToolBadge` component. Render one badge per entry in `message.tools_used`, above the message text. Badges remain visible when scrolling history.

**Files touched:** `frontend/src/components/ToolBadge.jsx`, `frontend/src/components/MessageBubble.jsx`.

**Acceptance test:**
- Currency question shows the "currency_converter" badge in the chat.
- Casual question ("hello") shows no badge.
- Scrolling up after several turns: every previous tool badge is still visible.

---

### Block 8 — Mode selector and voice playback (M)

**Goal:** `ModeSelector` component. When `mode === "voice"`, after `/chat` returns, the frontend calls `/tts` with the reply text, builds a blob URL, and renders an `AudioPlayer` in the message bubble. Switching modes mid-conversation only affects subsequent messages.

**Files touched:** `frontend/src/components/ModeSelector.jsx`, `frontend/src/components/AudioPlayer.jsx`, `frontend/src/components/MessageBubble.jsx`, `frontend/src/hooks/useChat.js`.

**Acceptance test:**
- Default mode is text; replies come as text only.
- Switching to voice and sending a message in Spanish: audio plays automatically in Spanish and a player UI is visible in the bubble.
- Switching to voice and sending a message in English: audio plays automatically in English with a native accent.
- Switching back to text mid-conversation: next reply is text only and the previous voice messages are still playable from history.

---

### Block 9 — Docker multi-stage build (M)

**Goal:** Single Dockerfile that builds the frontend in a Node stage, copies the static output into a Python stage that contains FastAPI plus the Piper binary and both configured voices (Spanish and English). `docker-compose.yml` for local parity.

**Files touched:** `Dockerfile`, `.dockerignore`, `docker-compose.yml`.

**Acceptance test:**
- `docker compose up --build` produces a working app on `http://localhost:8080` with text and voice modes both functional in Spanish and English.
- Both voice files exist at `/data/voices/` inside the container.
- The image is < 1.5 GB.

---

### Block 10 — Fly.io deployment (M)

**Goal:** Deploy the container to Fly.io with a persistent volume and secrets.

**Files touched:** `fly.toml`, `README.md` (deployment section).

**Acceptance test:**
- `fly deploy` succeeds.
- The deployed URL serves the app over HTTPS.
- A full text + voice conversation works end to end on the deployed URL.
- `fly logs` shows no errors during a normal turn.
- The `DEEPSEEK_API_KEY` is present in `fly secrets list` and absent from the repo.

---

### Block 11 — RAG pipeline (L)

**Goal:** Ingest a configurable URL into ChromaDB, expose a `rag_retriever` tool, and update the system prompt so the agent calls it for destination-specific questions. This block is mandatory in this build: the RAG component is treated as a required deliverable for the target score, not as an optional extra.

**Files touched:** `backend/rag/ingest.py`, `backend/tools/rag_retriever.py`, `backend/tools/__init__.py`, `backend/prompts/system.md`, `README.md`.

**Acceptance test:**
- `python -m backend.rag.ingest --url <URL>` reports the number of chunks indexed and exits cleanly.
- A question whose answer only appears in the ingested URL is answered correctly and `tools_used` contains `rag_retriever`.
- A general question (not specific to that URL) does not trigger `rag_retriever`.

---

## 11. Requirements traceability matrix

| Rubric requirement | Block | Verified by |
|---|---|---|
| Web app with chat interface | 6 | Block 6 test |
| Text/voice selector functional | 8 | Block 8 test |
| Single command or public URL | 9, 10 | `docker compose up` / `fly deploy` |
| Coherent context over 7 messages | 3 | Block 3 test |
| At least 2 working tools | 4 | Block 4 test |
| Agent decides tool usage autonomously | 4 | Tool selection is via LLM `tool_calls`, not hardcoded |
| System prompt with >=5 instructions | 3 | `backend/prompts/system.md` review |
| UI differentiates tool vs direct reply | 7 | Block 7 test |
| Tool indicator persists in history | 7 | Block 7 test |
| Reproducible voice output | 5, 8 | Block 5 / Block 8 tests |
| No API keys hardcoded | 1, 10 | `.env.example` review + `fly secrets list` |
| README runs the project from zero | 0, 10 | Fresh clone walk-through |
| English code and documentation | all | Code review |
| RAG over web URL | 11 | Block 11 test |

---

## 12. Final acceptance checklist

Run this end-to-end before submission. All items must pass.

**Deliverable packaging**
- [ ] Repository is public on GitHub and the `.zip` is named `firstname-lastname-voiceagent.zip`.
- [ ] `README.md` is in English and includes: setup, run command, tool descriptions (all three), chosen use case, the RAG source URL, and the ingest command.
- [ ] `.env.example` lists every variable from Section 7 with no real values.
- [ ] `git grep` for known key prefixes (e.g. `sk-`, `pk_`) returns nothing.

**Functional coverage**
- [ ] `docker compose up` brings the app online with no manual steps.
- [ ] Deployed URL (Fly.io) is reachable and serves a full text + voice conversation.
- [ ] System prompt file contains at least five numbered, distinct instructions covering role, tone, tool policy, restrictions, and language behavior.
- [ ] Tools `currency_converter`, `web_search`, and `rag_retriever` each fire on a representative prompt during demo.
- [ ] At least one casual prompt produces a reply with `tools_used: []` and no badge in the UI.
- [ ] Voice mode produces audible speech in the browser, both in Spanish and in English, using the correct voice for each language.
- [ ] A text-mode conversation in Spanish gets Spanish replies; a text-mode conversation in English gets English replies. Switching languages mid-conversation is handled correctly.
- [ ] Conversation memory holds across seven message pairs in the same session and is correctly truncated beyond that.
- [ ] RAG: a question whose answer only lives in the ingested URL is answered correctly with `rag_retriever` in `tools_used`.

**Language and documentation audit**
- [ ] All source files (`.py`, `.jsx`, `.js`, `.css`, `.md`, `.yml`, `.toml`, `Dockerfile`) are written in English: identifiers, comments, docstrings, log messages.
- [ ] All UI strings rendered to the user are in English (labels, placeholders, button text, badge captions, error toasts).
- [ ] `git log --oneline` shows commit messages in English.
- [ ] `system.md` and every tool's name, description, and parameter docstring are in English.
- [ ] Spot-check: search the repository for common Spanish tokens (`función`, `obtener`, `usuario`, `enviar`, `respuesta`, `error`) and confirm no hits outside of permitted exceptions (Section 1.1).

**Defense readiness**
- [ ] Architectural and technical decisions can be explained during the oral defense (memory window strategy, tool selection rationale, RAG chunking choices, DeepSeek vs alternatives, Piper vs cloud TTS, bilingual language detection strategy, Fly.io vs alternatives).

---

## 13. Out of scope

To keep the build tractable within the time budget, these are explicitly not part of this version:

- Speech-to-text (microphone input). The spec only requires multimodal output, not input.
- User authentication or multi-tenant isolation.
- Streaming responses (token-by-token). Replies are returned as a single payload.
- Voice cloning, voice selection at runtime, or multi-voice conversations.
- Observability stack (metrics, tracing). Application logs are sufficient.

If time remains after Block 11, microphone input via the Web Speech API is the highest-value follow-up.
