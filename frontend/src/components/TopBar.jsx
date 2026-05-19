import React from "react";
import { Icons } from "../lib/icons.jsx";
import LangSwitcher from "./LangSwitcher.jsx";
import ModeSelector from "./ModeSelector.jsx";

/**
 * Top navigation bar — sticky glass header hosting the sidebar toggle,
 * conversation title indicator, and global controls (language, mode, theme,
 * and session reset).
 */
export default function TopBar({
  onMenu, mode, setMode, onClear,
  uiLang, setUiLang, theme, setTheme, t,
}) {
  return (
    <header className="tb-topbar">
      <button className="tb-icon-btn tb-menu-btn" onClick={onMenu} aria-label="Toggle sidebar">
        <Icons.Menu size={16} />
      </button>
      <div className="tb-topbar-title">
        <span className="tb-dot" /> {t("conversation")}
      </div>
      <div className="tb-topbar-actions">
        <LangSwitcher lang={uiLang} setLang={setUiLang} />
        <ModeSelector mode={mode} setMode={setMode} t={t} />
        <button
          className="tb-icon-btn"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === "dark" ? <Icons.Sun size={15} /> : <Icons.Moon size={15} />}
        </button>
        <button className="tb-ghost-btn" onClick={onClear} title={t("reset")}>
          <Icons.Refresh size={14} /> {t("reset")}
        </button>
      </div>
    </header>
  );
}
