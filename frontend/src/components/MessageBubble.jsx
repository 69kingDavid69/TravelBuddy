import React, { useState, useCallback } from "react";
import { Icons } from "../lib/icons.jsx";
import { detectLang } from "../lib/lang.js";
import ToolTrace from "./ToolTrace.jsx";
import AudioPlayer from "./AudioPlayer.jsx";

/**
 * Dispatcher component — renders the appropriate bubble variant based on
 * the message role.  Keeps the ChatWindow's map() call clean.
 */
export default function MessageBubble({ m, mode, t }) {
  if (m.role === "user") return <UserBubble text={m.content} />;
  return <AssistantBubble m={m} mode={mode} t={t} />;
}

/** User message bubble with an auto-detected language pill (ES/EN). */
function UserBubble({ text }) {
  const lang = detectLang(text);
  return (
    <div className="tb-row tb-row-user">
      <div className="tb-msg tb-msg-user">
        <span className="tb-lang-pill" title="Auto-detected">{lang.toUpperCase()}</span>
        <div className="tb-msg-body">{text}</div>
      </div>
    </div>
  );
}

/**
 * Assistant message bubble with tool trace, copy-to-clipboard, vote actions,
 * and optional audio player (voice mode).  Manages local UI state only —
 * votes are not persisted to the backend.
 */
function AssistantBubble({ m, mode, t }) {
  const loading = m.isLoading;
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState(null); // "up" | "down" | null

  const handleCopy = useCallback(() => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(m.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [m.content]);

  const handleVote = useCallback((v) => {
    setVote((prev) => (prev === v ? null : v));
  }, []);

  return (
    <div className="tb-row tb-row-assistant">
      <div className="tb-avatar" aria-hidden="true">
        <Icons.Compass size={14} stroke={1.6} />
      </div>
      <div className="tb-msg-stack">
        <ToolTrace tools={m.tools} sources={m.sources} t={t} />
        <div className="tb-msg tb-msg-assistant">
          <div className="tb-msg-body">
            {m.error ? (
              <span className="tb-msg-error">{t("errorPrefix")}: {m.error}</span>
            ) : loading ? (
              <ThinkingDots />
            ) : (
              m.content
            )}
          </div>
          {mode === "voice" && m.audioUrl && !loading && !m.error && (
            <AudioPlayer src={m.audioUrl} voice={m.audioVoice} t={t} />
          )}
        </div>
        {!loading && !m.error && m.content && (
          <div className="tb-msg-actions">
            <button
              className={`tb-msg-act ${copied ? "tb-msg-act--active" : ""}`}
              title={copied ? t("copied") : t("copy")}
              onClick={handleCopy}
            >
              {copied ? <Icons.Check size={13} /> : <Icons.Copy size={13} />}
            </button>
            <button
              className={`tb-msg-act ${vote === "up" ? "tb-msg-act--active" : ""}`}
              title={t("good")}
              onClick={() => handleVote("up")}
            >
              <Icons.ThumbUp size={13} />
            </button>
            <button
              className={`tb-msg-act ${vote === "down" ? "tb-msg-act--active" : ""}`}
              title={t("bad")}
              onClick={() => handleVote("down")}
            >
              <Icons.ThumbDown size={13} />
            </button>
            <span className="tb-msg-time"><Icons.Clock size={11} /> {t("justNow")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Animated three-dot indicator rendered inside the bubble while the agent is thinking. */
function ThinkingDots() {
  return (
    <span className="tb-thinking" aria-label="Thinking">
      <i /><i /><i />
    </span>
  );
}
