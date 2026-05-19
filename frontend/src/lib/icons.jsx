/**
 * Monoline icon set — 1.5px strokes, rounded caps.
 *
 * All icons share a base SVG wrapper (Icon) that normalises viewBox, stroke
 * width, and line caps.  Each named export is a thin wrapper passing its
 * specific path data.  Icons are marked aria-hidden because they are always
 * paired with visible labels or accessible button names.
 */
import React from "react";

/**
 * Base SVG wrapper shared by all icons.  Accepts an SVG path string or
 * JSX children for complex shapes (e.g. Mic uses rect + path).
 */
const Icon = ({ d, size = 16, stroke = 1.5, fill = "none", style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    aria-hidden="true"
  >
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

export const Icons = {
  Send:    (p) => <Icon {...p} d="M5 12h14M13 6l6 6-6 6" />,
  Mic:     (p) => <Icon {...p} d={<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>} />,
  Type:    (p) => <Icon {...p} d="M4 7V5h16v2M9 5v14M15 19h-6" />,
  Sparkle: (p) => <Icon {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.7 2 2 .7-2 .7L19 22l-.7-1.6-2-.7 2-.7z" />,
  Currency:(p) => <Icon {...p} d="M12 2v20M16 6.5C16 4.6 14.2 3 12 3S8 4.6 8 6.5s1.8 3 4 3 4 1.6 4 3.5-1.8 3.5-4 3.5S8 14.9 8 13" />,
  Search:  (p) => <Icon {...p} d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm5.5 12.5L21 21" />,
  Book:    (p) => <Icon {...p} d="M4 4h11a3 3 0 0 1 3 3v14M4 4v14a3 3 0 0 0 3 3h11M4 4a2 2 0 0 0 0 4h11M8 8v9" />,
  Globe:   (p) => <Icon {...p} d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />,
  ArrowUp: (p) => <Icon {...p} d="M12 19V5M5 12l7-7 7 7" />,
  Plus:    (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  Chevron: (p) => <Icon {...p} d="M9 18l6-6-6-6" />,
  Check:   (p) => <Icon {...p} d="M5 13l4 4L19 7" />,
  Clock:   (p) => <Icon {...p} d="M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />,
  Stop:    (p) => <Icon {...p} d={<rect x="6" y="6" width="12" height="12" rx="2" />} />,
  Play:    (p) => <Icon {...p} fill="currentColor" stroke="none" d="M7 4v16l13-8z" />,
  Pause:   (p) => <Icon {...p} fill="currentColor" stroke="none" d="M6 4h4v16H6zM14 4h4v16h-4z" />,
  Volume:  (p) => <Icon {...p} d="M4 10v4h3l5 4V6L7 10H4M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" />,
  Compass: (p) => <Icon {...p} d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3 6l-1.5 5-5 1.5L10 10z" />,
  Copy:    (p) => <Icon {...p} d="M8 8h11v11H8zM4 4h11v11M4 4v11h11" />,
  Refresh: (p) => <Icon {...p} d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />,
  ThumbUp: (p) => <Icon {...p} d="M7 11v9H4v-9zM7 11l4-7c1.5 0 3 1 3 3v3h5a2 2 0 0 1 2 2l-1.5 7a2 2 0 0 1-2 1.5H7" />,
  ThumbDown:(p) => <Icon {...p} d="M7 13V4H4v9zM7 13l4 7c1.5 0 3-1 3-3v-3h5a2 2 0 0 0 2-2l-1.5-7a2 2 0 0 0-2-1.5H7" />,
  Menu:    (p) => <Icon {...p} d="M4 6h16M4 12h16M4 18h16" />,
  X:       (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18" />,
  Sun:     (p) => <Icon {...p} d="M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6l-1.4-1.4M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z" />,
  Moon:    (p) => <Icon {...p} d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />,
};
