import { useState, useEffect } from "react";
import { useChat } from "./hooks/useChat";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";

function getSessionId() {
  let sid = localStorage.getItem("session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("session_id", sid);
  }
  return sid;
}

export default function App() {
  const [sessionId] = useState(getSessionId);
  const [mode] = useState("text");
  const { messages, isLoading, sendMessage } = useChat(sessionId, mode);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-lg">
      <header className="bg-blue-600 text-white px-4 py-3 text-center font-bold text-lg">
        TravelBuddy
      </header>
      <ChatWindow messages={messages} />
      <InputBar onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
