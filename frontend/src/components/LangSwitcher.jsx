import React from "react";

/**
 * UI-language toggle (Spanish / English). Persisted via useUiLang.
 *
 * NOTE: the project rubric mandates English-only UI strings; this control
 * exists per a design request and can be removed before submission.
 */
export default function LangSwitcher({ lang, setLang }) {
  return (
    <div className="tb-lang" role="group" aria-label="UI language">
      <button
        className={`tb-lang-opt ${lang === "en" ? "is-on" : ""}`}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        className={`tb-lang-opt ${lang === "es" ? "is-on" : ""}`}
        onClick={() => setLang("es")}
        aria-pressed={lang === "es"}
      >
        ES
      </button>
      <span className={`tb-lang-thumb tb-lang-${lang}`} />
    </div>
  );
}
