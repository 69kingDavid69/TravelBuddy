import React, { useEffect, useRef } from "react";
import EmptyState from "./EmptyState.jsx";
import MessageBubble from "./MessageBubble.jsx";

/**
 * Scrollable message list. Auto-scrolls to the bottom whenever the messages
 * array changes — covers both new turns and streaming text growth.
 */
export default function ChatWindow({ messages, mode, onPick, t }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="tb-chat" ref={scrollRef}>
      {messages.length === 0 ? (
        <EmptyState onPick={onPick} t={t} />
      ) : (
        <div className="tb-thread">
          {messages.map((m) => (
            <MessageBubble key={m.id} m={m} mode={mode} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
