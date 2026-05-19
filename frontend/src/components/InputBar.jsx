import React, { useEffect, useRef, useState } from "react";
import { Icons } from "../lib/icons.jsx";
import ModeSelector from "./ModeSelector.jsx";

/**
 * Composer. Auto-grows up to 180px tall. Enter sends; Shift+Enter inserts a
 * newline. Disabled while a /chat request is in flight.
 */
export default function InputBar({ onSend, disabled, mode, setMode, t }) {
  const [text, setText] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = Math.min(180, ref.current.scrollHeight) + "px";
  }, [text]);

  const submit = () => {
    const v = text.trim();
    if (!v || disabled) return;
    onSend(v);
    setText("");
  };

  return (
    <div className="tb-composer-wrap">
      <div className="tb-composer">
        <textarea
          ref={ref}
          className="tb-input"
          placeholder={t("placeholder")}
          value={text}
          rows={1}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="tb-composer-bar">
          <div className="tb-composer-left">
            <ModeSelector mode={mode} setMode={setMode} t={t} />
            <span className="tb-tool-hint">
              <Icons.Sparkle size={11} /> {t("autoTools")}
            </span>
          </div>
          <div className="tb-composer-right">
            <span className="tb-counter">{text.length}</span>
            <button
              className="tb-send"
              onClick={submit}
              disabled={!text.trim() || disabled}
              aria-label="Send"
            >
              {disabled ? <Icons.Stop size={14} /> : <Icons.ArrowUp size={14} stroke={2} />}
            </button>
          </div>
        </div>
      </div>
      <div className="tb-shortcut-hint">
        <kbd>Enter</kbd> {t("shortcutHint1")} · <kbd>Shift</kbd>+<kbd>Enter</kbd> {t("shortcutHint2")}
      </div>
    </div>
  );
}
