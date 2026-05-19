import ToolBadge from "./ToolBadge";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const hasTools = message.tools_used && message.tools_used.length > 0;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%]">
        {hasTools && (
          <div className="mb-1">
            {message.tools_used.map((tool) => (
              <ToolBadge key={tool} tool={tool} />
            ))}
          </div>
        )}
        <div
          className={`rounded-xl px-4 py-2 whitespace-pre-wrap text-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
