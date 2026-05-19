/**
 * Displays a colored pill badge indicating which backend tool was invoked.
 * Each tool gets a distinct color to help users quickly scan which capabilities
 * were used in a response. Unknown tool names fall back to a neutral gray.
 */
const TOOL_COLORS = {
  currency_converter: "bg-green-100 text-green-800 border-green-300",
  web_search: "bg-blue-100 text-blue-800 border-blue-300",
  rag_retriever: "bg-purple-100 text-purple-800 border-purple-300",
};

export default function ToolBadge({ tool }) {
  /** Resolve the color class from the map; default to gray for unknown tools. */
  const colorClass =
    TOOL_COLORS[tool] || "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass} mr-1`}
    >
      {tool}
    </span>
  );
}
