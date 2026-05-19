/**
 * Text input bar with a send button, rendered as a form.
 * Handles its own local input state and communicates the trimmed
 * message value upward only on valid submission.
 */
import { useState } from "react";

export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    /** Guard against empty or whitespace-only submissions. */
    if (!trimmed || disabled) return;
    onSend(trimmed);
    /** Clear the input immediately after sending for a clean UX. */
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 px-4 py-3 flex gap-2 bg-white"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <button
        type="submit"
        /** Disable the button when loading or when there is no meaningful input. */
        disabled={disabled || !text.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}
