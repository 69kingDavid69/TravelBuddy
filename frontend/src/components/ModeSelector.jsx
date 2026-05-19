import React from "react";
import { Icons } from "../lib/icons.jsx";

/**
 * Segmented control: Text / Voice. The architecture spec calls for this
 * exact name. Used in the top bar and inside the composer footer.
 */
export default function ModeSelector({ mode, setMode, t }) {
  return (
    <div className="tb-mode" role="tablist" aria-label="Response mode">
      <button
        role="tab"
        aria-selected={mode === "text"}
        className={`tb-mode-opt ${mode === "text" ? "is-on" : ""}`}
        onClick={() => setMode("text")}
      >
        <Icons.Type size={13} /> {t("modeText")}
      </button>
      <button
        role="tab"
        aria-selected={mode === "voice"}
        className={`tb-mode-opt ${mode === "voice" ? "is-on" : ""}`}
        onClick={() => setMode("voice")}
      >
        <Icons.Volume size={13} /> {t("modeVoice")}
      </button>
      <span className={`tb-mode-thumb tb-mode-${mode}`} />
    </div>
  );
}
