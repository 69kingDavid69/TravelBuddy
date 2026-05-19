/**
 * Root application component.
 * Manages top-level state (session ID, interaction mode) and composes the
 * main layout: header, mode selector, chat window, and input bar.
 */
import { useState } from "react";
import { useChat } from "./hooks/useChat";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import ModeSelector from "./components/ModeSelector";

/**
 * Retrieves or creates a persistent session identifier stored in localStorage.
 * This allows the backend to maintain conversation context across page reloads
 * without requiring authentication.
 */
function getSessionId() {
  let sid = localStorage.getItem("session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("session_id", sid);
  }
  return sid;
}

export default function App() {
  /** Lazily initialize sessionId so the expensive crypto call only runs once. */
  const [sessionId] = useState(getSessionId);
  const [mode, setMode] = useState("text");
  const { messages, isLoading, sendMessage } = useChat(sessionId, mode);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-lg">
      <header className="bg-blue-600 text-white px-4 py-3 text-center font-bold text-lg">
        TravelBuddy
      </header>
      <ModeSelector mode={mode} onChange={setMode} />
      <ChatWindow messages={messages} />
      <InputBar onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
