import React from "react";
import { Icons } from "../lib/icons.jsx";
import { TOOLS } from "../lib/tools.js";

/**
 * Renders a single tool name returned in `tools_used`. States:
 *   - "done"    — default; check icon after the label
 *   - "running" — dotted spinner; reserved for streaming UIs (the current
 *                 /chat endpoint returns synchronously so most badges go
 *                 straight to "done")
 */
export default function ToolBadge({ name, state = "done", t }) {
  const meta = TOOLS[name];
  if (!meta) return null;
  const Ico = Icons[meta.icon];
  return (
    <span className={`tb-tool tb-tool-${state}`}>
      <span className="tb-tool-ico"><Ico size={11} stroke={1.7} /></span>
      <span className="tb-tool-name">{t(meta.labelKey)}</span>
      {state === "running" && (
        <span className="tb-tool-dots" aria-hidden="true"><i /><i /><i /></span>
      )}
      {state === "done" && <Icons.Check size={11} stroke={2} />}
    </span>
  );
}
