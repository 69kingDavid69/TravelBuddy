/**
 * Scrollable container that renders the list of chat messages.
 * Displays a placeholder prompt when the conversation is empty
 * to guide the user toward their first interaction.
 */
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ messages }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
      {messages.length === 0 && (
        <p className="text-gray-400 text-center mt-8">
          Start a conversation with TravelBuddy.
        </p>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}
