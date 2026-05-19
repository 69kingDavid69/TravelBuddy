/**
 * useTheme — manages the light/dark colour scheme.
 *
 * Reads the initial preference from localStorage, falling back to the OS-level
 * prefers-color-scheme media query.  Theme tokens are applied imperatively via
 * a ref to the root DOM element (see applyTheme in lib/theme.js) rather than
 * CSS classes, because the design system uses CSS custom properties.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { applyTheme } from "../lib/theme.js";

const LS = "travelbuddy.theme";

/**
 * Read the persisted theme or detect the user's OS preference.
 * Wrapped in a try/catch because localStorage may throw in private browsing.
 */
function readInitial() {
  try {
    const v = localStorage.getItem(LS);
    if (v === "light" || v === "dark") return v;
  } catch (e) {}
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

/** Hook providing the current theme, a setter, and a ref to attach to the root element. */
export function useTheme() {
  const [theme, setThemeState] = useState(readInitial);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;
    applyTheme(rootRef.current, theme);
  }, [theme]);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    try { localStorage.setItem(LS, t); } catch (e) {}
  }, []);

  return { theme, setTheme, rootRef };
}
