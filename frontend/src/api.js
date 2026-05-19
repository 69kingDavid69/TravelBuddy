/**
 * API client layer for backend communication.
 * All HTTP requests to the chat and text-to-speech endpoints are centralized
 * here so that error handling, base URL resolution, and serialization logic
 * remain consistent across the application.
 */

/** Falls back to empty string so relative paths work for same-origin deployments. */
const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Sends a chat message to the backend and returns the assistant's reply.
 * @param {Object} params
 * @param {string} params.message - User's input text.
 * @param {string} params.mode - Interaction mode ("text" or "voice").
 * @param {string} params.sessionId - Persistent conversation identifier.
 * @returns {Promise<Object>} Parsed JSON response containing reply and tool metadata.
 */
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

/**
 * Converts text to speech via the backend TTS endpoint.
 * @param {Object} params
 * @param {string} params.text - Text to synthesize into audio.
 * @returns {Promise<Blob>} Audio blob (WAV format) playable by the browser.
 */
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
