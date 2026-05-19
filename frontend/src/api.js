const API_BASE = import.meta.env.VITE_API_URL || "";

export async function postChat({ message, mode, sessionId }) {
  const resp = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, mode, session_id: sessionId }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`Chat error ${resp.status}: ${detail}`);
  }
  return resp.json();
}

export async function postTTS({ text }) {
  const resp = await fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`TTS error ${resp.status}: ${detail}`);
  }
  return resp.blob();
}
