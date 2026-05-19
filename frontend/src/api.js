// Network layer — all calls into FastAPI live here.
// Components never touch fetch directly.

const API_BASE = import.meta.env.VITE_API_URL || "";

async function ensureOk(resp) {
  if (resp.ok) return resp;
  const detail = await resp.text().catch(() => resp.statusText);
  const err = new Error(`HTTP ${resp.status}: ${detail || resp.statusText}`);
  err.status = resp.status;
  throw err;
}

/**
 * POST /chat — sends a user message and gets back the agent's reply plus the
 * list of tools it invoked. The agent decides tool usage autonomously; the
 * frontend never picks tools.
 *
 * @param {{ message: string, mode: "text"|"voice", sessionId: string }} args
 * @returns {Promise<{ reply: string, tools_used: string[], session_id: string }>}
 */
export async function postChat({ message, mode, sessionId }) {
  const resp = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, mode, session_id: sessionId }),
  });
  await ensureOk(resp);
  return resp.json();
}

/**
 * POST /tts — synthesizes the given text. Language is auto-detected on the
 * backend so the frontend stays language-agnostic; the chosen voice is
 * reported back via the X-TTS-Voice response header for debuggability.
 *
 * @param {{ text: string }} args
 * @returns {Promise<{ blob: Blob, voice: string|null }>}
 */
export async function postTTS({ text }) {
  const resp = await fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  await ensureOk(resp);
  const voice = resp.headers.get("X-TTS-Voice");
  const blob = await resp.blob();
  return { blob, voice };
}

/** GET /health — used by smoke tests and the dev banner. */
export async function getHealth() {
  const resp = await fetch(`${API_BASE}/health`);
  await ensureOk(resp);
  return resp.json();
}
