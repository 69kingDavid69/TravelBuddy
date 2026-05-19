import React from "react";
import { Icons } from "../lib/icons.jsx";

/**
 * The sidebar list is local-only state in App. The backend scopes memory by
 * session_id (LangGraph MemorySaver) but does not expose a list endpoint, so
 * we cannot enumerate the agent's checkpoints. The list here reflects the
 * user's *local* history — if you implement a real /sessions endpoint
 * later, feed that into the `sessions` prop.
 */
export default function Sidebar({ open, onClose, sessions, activeId, onSelect, onDelete, onNew, t }) {
  return (
    <aside className={`tb-sidebar ${open ? "is-open" : ""}`} aria-label="Sessions">
      <div className="tb-sidebar-head">
        <div className="tb-brand">
          <span className="tb-brand-mark" aria-hidden="true">
            <Icons.Compass size={18} stroke={1.6} />
          </span>
          <span className="tb-brand-name">TravelBuddy</span>
        </div>
        <button className="tb-icon-btn tb-sidebar-close" onClick={onClose} aria-label="Close sidebar">
          <Icons.X size={16} />
        </button>
      </div>

      <button className="tb-new-btn" onClick={onNew}>
        <Icons.Plus size={14} /> <span>{t("newConversation")}</span>
        <kbd className="tb-kbd">⌘N</kbd>
      </button>

      <div className="tb-sidebar-section">{t("recent")}</div>
      <nav className="tb-session-list">
        {sessions.map((s) => (
          <div key={s.id} className="group relative flex items-stretch">
            <button
              className={`tb-session flex-1 min-w-0 pr-6 ${s.id === activeId ? "is-active" : ""}`}
              onClick={() => onSelect(s.id)}
            >
              <span className="tb-session-title">{s.title}</span>
              <span className="tb-session-meta">{s.when}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
              aria-label="Delete conversation"
              title="Delete conversation"
              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded hover:bg-red-100 hover:text-red-500 text-current"
            >
              <Icons.X size={12} />
            </button>
          </div>
        ))}
      </nav>

      <div className="tb-sidebar-foot">
        <div className="tb-foot-card">
          <div className="tb-foot-title">{t("brandTagline")}</div>
          <div className="tb-foot-sub">{t("brandStack")}</div>
        </div>
      </div>
    </aside>
  );
}
