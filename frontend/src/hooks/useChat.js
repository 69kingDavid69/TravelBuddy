import { useState, useCallback } from "react";
import { postChat, postTTS } from "../api";

export function useChat(sessionId, mode) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (text) => {
      const userMsg = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        tools_used: [],
        audio_url: null,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const data = await postChat({ message: text, mode, sessionId });

        let audio_url = null;
        if (mode === "voice" && data.reply) {
          const blob = await postTTS({ text: data.reply });
          audio_url = URL.createObjectURL(blob);
        }

        const assistantMsg = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          tools_used: data.tools_used || [],
          audio_url,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errMsg = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${err.message}`,
          tools_used: [],
          audio_url: null,
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [mode, sessionId]
  );

  return { messages, isLoading, sendMessage };
}
