import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import InputBar from "./components/InputBar.jsx";
import { useChat } from "./hooks/useChat.js";
import { useTheme } from "./hooks/useTheme.js";
import { useUiLang } from "./hooks/useUiLang.js";

/**
 * App — top-level shell.
 *
 * Session id is generated on first load and persisted to localStorage so a
 * page refresh keeps backend memory continuity.
 */
function getSessionId() {
  let sid = null;
  try { sid = localStorage.getItem("session_id"); } catch (e) {}
  if (!sid) {
    sid = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    try { localStorage.setItem("session_id", sid); } catch (e) {}
  }
  return sid;
}

export default function App() {
  const { theme, setTheme, rootRef } = useTheme();
  const { lang: uiLang, setLang: setUiLang, t } = useUiLang();

  const [sessionId, setSessionId] = useState(getSessionId);
  const [mode, setMode] = useState("text");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { messages, sendMessage, isLoading, reset } = useChat(sessionId, mode);

  // Local-only sidebar list. Replace with a real /sessions endpoint if you
  // add one server-side.
  const [sessions, setSessions] = useState([
    { id: sessionId, title: "Current session", when: "Today" },
  ]);
  const [activeSession, setActiveSession] = useState(sessionId);

  const handleNew = useCallback(() => {
    const sid = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    try { localStorage.setItem("session_id", sid); } catch (e) {}
    setSessionId(sid);
    setActiveSession(sid);
    setSessions((prev) => [
      { id: sid, title: "New conversation", when: "Today" },
      ...prev.filter((s) => s.id !== sid),
    ]);
    reset();
  }, [reset]);

  const handleSelect = useCallback((id) => {
    setActiveSession(id);
    setSessionId(id);
    try { localStorage.setItem("session_id", id); } catch (e) {}
    reset();
  }, [reset]);

  const handleDelete = useCallback((id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    // If the deleted session was active, open a fresh conversation
    if (id === activeSession) {
      handleNew();
    }
  }, [activeSession, handleNew]);

  const handleClear = useCallback(() => reset(), [reset]);

  // ⌘N / Ctrl+N → new conversation
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNew();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNew]);

  return (
    <div
      ref={rootRef}
      className={`tb-app ${sidebarOpen ? "" : "tb-sidebar-collapsed"}`}
      data-theme={theme}
      lang={uiLang}
    >
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeId={activeSession}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onNew={handleNew}
        t={t}
      />
      <main className="tb-main">
        <TopBar
          onMenu={() => setSidebarOpen((v) => !v)}
          mode={mode}
          setMode={setMode}
          onClear={handleClear}
          uiLang={uiLang}
          setUiLang={setUiLang}
          theme={theme}
          setTheme={setTheme}
          t={t}
        />
        <ChatWindow messages={messages} mode={mode} onPick={sendMessage} t={t} />
        <InputBar
          onSend={sendMessage}
          disabled={isLoading}
          mode={mode}
          setMode={setMode}
          t={t}
        />
      </main>
    </div>
  );
}
