import { useState, useCallback, useRef } from "react";
import { postChat, postTTS } from "../api.js";

/**
 * useChat — owns the chat thread for a single session.
 *
 * Flow per turn:
 *   1. Append the user message immediately.
 *   2. Append an assistant placeholder with isLoading = true. The UI shows a
 *      "thinking" state — the tool badges below the bubble will fill in once
 *      the backend response arrives. (Replies are not streamed: the backend
 *      returns a single payload.)
 *   3. POST /chat. Map tools_used onto badge entries with state: "done".
 *   4. If mode === "voice", also POST /tts and attach the resulting blob URL.
 *
 * The sidebar's session list is local-only state in App.jsx. The backend
 * scopes memory by session_id, but exposes no list endpoint — so the
 * sidebar reflects the user's local history, not the agent's checkpoints.
 */
export function useChat(sessionId, mode) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const audioUrlsRef = useRef([]);

  const reset = useCallback(() => {
    audioUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    audioUrlsRef.current = [];
    setMessages([]);
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text || !text.trim() || isLoading) return;
    const trimmed = text.trim();

    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now() + 1}`;

    setMessages((m) => [
      ...m,
      { id: userId,      role: "user",      content: trimmed },
      { id: assistantId, role: "assistant", content: "", tools: [], isLoading: true },
    ]);
    setIsLoading(true);

    try {
      const { reply, tools_used } = await postChat({
        message: trimmed,
        mode,
        sessionId,
      });

      const tools = (tools_used || []).map((name) => ({ name, state: "done" }));

      let audioUrl = null;
      let audioVoice = null;
      if (mode === "voice" && reply) {
        try {
          const { blob, voice } = await postTTS({ text: reply });
          audioUrl = URL.createObjectURL(blob);
          audioVoice = voice;
          audioUrlsRef.current.push(audioUrl);
        } catch (ttsErr) {
          // TTS failure should not break the text reply.
          console.error("TTS failed:", ttsErr);
        }
      }

      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: reply, tools, audioUrl, audioVoice, isLoading: false }
            : msg
        )
      );
    } catch (err) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: "", error: err.message || String(err), isLoading: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, mode, isLoading]);

  return { messages, sendMessage, isLoading, reset };
}
