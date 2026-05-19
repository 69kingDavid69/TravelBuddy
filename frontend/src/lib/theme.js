// Theme tokens — warm-neutral monochrome with a single brand accent.
//
// Production uses a single accent ("Copper"); the design prototype exposed
// three palettes as a Tweak but the deployed app commits to one. To change
// the brand color edit ACCENT below.

const ACCENT_COPPER = {
  light: { fg: "oklch(0.55 0.13 50)", bg: "oklch(0.96 0.025 75)", ring: "oklch(0.55 0.13 50 / 0.18)" },
  dark:  { fg: "oklch(0.78 0.12 65)", bg: "oklch(0.28 0.04 60)",  ring: "oklch(0.78 0.12 65 / 0.22)" },
};

const ACCENT = ACCENT_COPPER;

/**
 * Apply the given theme's CSS custom properties to a DOM element.
 *
 * Uses OKLCH colour space for perceptually uniform lightness steps.
 * Tokens are set imperatively via style.setProperty rather than class
 * toggles so that any component reading var(--token) gets an instant update
 * without a stylesheet swap.
 *
 * @param {HTMLElement} rootEl - The element to apply CSS custom properties to.
 * @param {"light"|"dark"} theme - The active colour scheme.
 */
export function applyTheme(rootEl, theme) {
  const isDark = theme === "dark";
  const t = isDark ? ACCENT.dark : ACCENT.light;

  const tokens = isDark
    ? {
        "--bg":         "oklch(0.16 0.005 60)",
        "--bg-elev":    "oklch(0.20 0.006 60)",
        "--bg-soft":    "oklch(0.22 0.007 60)",
        "--surface":    "oklch(0.19 0.006 60)",
        "--fg":         "oklch(0.96 0.005 80)",
        "--fg-muted":   "oklch(0.72 0.008 70)",
        "--fg-subtle":  "oklch(0.52 0.006 60)",
        "--border":     "oklch(0.30 0.006 60)",
        "--border-soft":"oklch(0.25 0.005 60)",
        "--accent":     t.fg,
        "--accent-bg":  t.bg,
        "--accent-ring":t.ring,
        "--user-bg":    "oklch(0.27 0.006 60)",
        "--user-fg":    "oklch(0.96 0.005 80)",
        "--shadow-card":"0 1px 0 oklch(1 0 0 / 0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        "--glass":      "oklch(0.18 0.006 60 / 0.78)",
      }
    : {
        "--bg":         "oklch(0.985 0.006 80)",
        "--bg-elev":    "oklch(1 0 0)",
        "--bg-soft":    "oklch(0.97 0.008 80)",
        "--surface":    "oklch(1 0 0)",
        "--fg":         "oklch(0.18 0.008 60)",
        "--fg-muted":   "oklch(0.42 0.008 60)",
        "--fg-subtle":  "oklch(0.62 0.006 70)",
        "--border":     "oklch(0.90 0.008 75)",
        "--border-soft":"oklch(0.94 0.006 75)",
        "--accent":     t.fg,
        "--accent-bg":  t.bg,
        "--accent-ring":t.ring,
        "--user-bg":    "oklch(0.93 0.008 75)",
        "--user-fg":    "oklch(0.18 0.008 60)",
        "--shadow-card":"0 1px 0 oklch(1 0 0 / 0.6) inset, 0 8px 24px -12px rgba(60,40,20,0.12)",
        "--glass":      "oklch(0.985 0.006 80 / 0.78)",
      };

  Object.entries(tokens).forEach(([k, v]) => rootEl.style.setProperty(k, v));
  rootEl.dataset.theme = theme;
}
