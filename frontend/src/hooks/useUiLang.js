/**
 * useUiLang — manages the UI display language (English / Spanish).
 *
 * Persists the user's choice to localStorage.  On first visit, auto-detects
 * from navigator.language so Spanish-speaking browsers see the Spanish UI
 * by default.  Exposes a `t(key)` helper that resolves i18n string keys
 * against the active locale.
 */
import { useState, useCallback } from "react";
import { STRINGS } from "../lib/i18n.js";

const LS = "travelbuddy.uiLang";

/**
 * Read the persisted UI language or detect from the browser's locale.
 * Falls back to English for non-Spanish browsers.
 */
function readInitial() {
  try {
    const v = localStorage.getItem(LS);
    if (v === "en" || v === "es") return v;
  } catch (e) {}
  if (typeof navigator !== "undefined" && /^es/i.test(navigator.language || "")) return "es";
  return "en";
}

/** Hook providing the active language code, a setter, and a translation helper. */
export function useUiLang() {
  const [lang, setLangState] = useState(readInitial);
  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem(LS, l); } catch (e) {}
  }, []);
  const t = useCallback((key) => (STRINGS[lang] || STRINGS.en)[key] || key, [lang]);
  return { lang, setLang, t };
}
