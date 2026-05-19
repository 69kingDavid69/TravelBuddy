/**
 * Tool metadata registry — maps backend tool names to UI presentation data.
 *
 * `labelKey` references an i18n string for the display name; `icon` references
 * a named export from lib/icons.jsx.  This registry drives the ToolBadge and
 * EmptyState components.  When a new tool is added to the backend's ALL_TOOLS,
 * add a corresponding entry here so badges render correctly.
 */

export const TOOLS = {
  currency_converter: { labelKey: "toolCurrency", icon: "Currency" },
  web_search:         { labelKey: "toolWeb",      icon: "Search"   },
  rag_retriever:      { labelKey: "toolGuide",    icon: "Book"     },
};
