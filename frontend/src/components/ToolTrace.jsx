import React from "react";
import ToolBadge from "./ToolBadge.jsx";

/**
 * Row of tool badges above an assistant message. Renders nothing for a
 * direct LLM reply (empty tools_used), per the rubric.
 *
 * If the backend ever returns retrieval sources (e.g. an array of
 * {title, snippet, url, score} from rag_retriever), pass them as `sources`
 * and the row will show an expand toggle. The current backend contract
 * doesn't include sources, so this is no-op until added.
 */
export default function ToolTrace({ tools, sources, t }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!tools || tools.length === 0) return null;
  const hasSources = sources && sources.length > 0;

  return (
    <div className="tb-trace">
      <div className="tb-trace-row">
        {tools.map((tt, i) => (
          <ToolBadge key={i} name={tt.name} state={tt.state} t={t} />
        ))}
        {hasSources && (
          <button className="tb-sources-btn" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Hide sources" : "Show sources"}
          </button>
        )}
      </div>
      {hasSources && expanded && (
        <ul className="tb-sources">
          {sources.map((s, i) => (
            <li key={i} className="tb-source">
              <span className="tb-source-rank">{i + 1}</span>
              <div className="tb-source-body">
                <div className="tb-source-title">{s.title}</div>
                <div className="tb-source-snippet">{s.snippet}</div>
                <div className="tb-source-meta">
                  {s.url}
                  {typeof s.score === "number" && (
                    <span className="tb-source-score">score {s.score.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
