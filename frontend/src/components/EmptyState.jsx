import React from "react";
import { Icons } from "../lib/icons.jsx";
import { TOOLS } from "../lib/tools.js";
import Chip from "./Chip.jsx";

/**
 * Onboarding view shown when the conversation has no messages yet.
 *
 * Displays the hero headline, a subtitle, and a 2×2 grid of suggestion cards.
 * Clicking a suggestion fires `onPick` with the card's title text, which the
 * parent routes through sendMessage to start the conversation.
 */
export default function EmptyState({ onPick, t }) {
  const suggestions = [
    { tool: "currency_converter", title: t("sg1Title"), sub: t("sg1Sub") },
    { tool: "web_search",         title: t("sg2Title"), sub: t("sg2Sub") },
    { tool: "rag_retriever",      title: t("sg3Title"), sub: t("sg3Sub") },
    { tool: null,                 title: t("sg4Title"), sub: t("sg4Sub") },
  ];

  return (
    <div className="tb-empty">
      <div className="tb-empty-inner">
        <div className="tb-empty-eyebrow">
          <span className="tb-pulse" /> {t("statusOnline")}
        </div>
        <h1 className="tb-hero">
          <span className="tb-hero-serif">{t("heroLine1")}</span> {t("heroLine1b")}
          <br />
          <span className="tb-hero-accent">{t("heroLine2")}</span>
        </h1>
        <p className="tb-hero-sub">{t("heroSub")}</p>

        <div className="tb-suggest-grid">
          {suggestions.map((s, i) => (
            <button key={i} className="tb-suggest" onClick={() => onPick(s.title)}>
              <div className="tb-suggest-icon">
                {s.tool
                  ? React.createElement(Icons[TOOLS[s.tool].icon], { size: 15 })
                  : <Icons.Sparkle size={15} />}
              </div>
              <div className="tb-suggest-text">
                <div className="tb-suggest-title">{s.title}</div>
                <div className="tb-suggest-sub">{s.sub}</div>
              </div>
              <Icons.ArrowUp size={13} style={{ transform: "rotate(45deg)", opacity: 0.45 }} />
            </button>
          ))}
        </div>

        <div className="tb-empty-foot">
          <Chip label="currency_converter" icon="Currency" />
          <Chip label="web_search" icon="Search" />
          <Chip label="rag_retriever" icon="Book" />
        </div>
      </div>
    </div>
  );
}
