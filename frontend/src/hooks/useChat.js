/**
 * Custom hook encapsulating all chat-related state and side-effects.
 * Handles optimistic user-message insertion, async API calls, optional TTS
 * synthesis for voice mode, and error display.
 */
import { useState, useCallback } from "react";
import { postChat, postTTS } from "../api";

export function useChat(sessionId, mode) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (text) => {
      /**
       * Insert the user message into state immediately (optimistic UI)
       * before the network call completes so the interface feels responsive.
       */
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
        /**
         * In voice mode, synthesize the assistant reply into an audio blob.
         * We create a local blob URL so the AudioPlayer component can stream
         * the audio directly without another network round-trip.
         */
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
        /**
         * Render errors as assistant-styled messages so the user sees
         * feedback inline rather than through a separate toast/notification.
         */
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
