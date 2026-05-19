import React from "react";
import { Icons } from "../lib/icons.jsx";

/**
 * Compact label pill rendered alongside an icon.
 * Used in the EmptyState footer to show available agent tools at a glance.
 */
export default function Chip({ label, icon }) {
  const Ico = Icons[icon];
  return (
    <span className="tb-chip">
      <Ico size={12} /> <span>{label}</span>
    </span>
  );
}
