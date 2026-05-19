/**
 * Toggle control for switching between "text" and "voice" interaction modes.
 * Uses radio buttons with a shared name so the browser enforces mutual exclusivity,
 * providing a clear single-selection UX without custom logic.
 */
export default function ModeSelector({ mode, onChange }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200">
      <span className="text-xs font-medium text-gray-500">Mode:</span>
      <label className="flex items-center gap-1 text-sm cursor-pointer">
        <input
          type="radio"
          name="mode"
          value="text"
          checked={mode === "text"}
          onChange={() => onChange("text")}
          className="accent-blue-600"
        />
        Text
      </label>
      <label className="flex items-center gap-1 text-sm cursor-pointer">
        <input
          type="radio"
          name="mode"
          value="voice"
          checked={mode === "voice"}
          onChange={() => onChange("voice")}
          className="accent-blue-600"
        />
        Voice
      </label>
    </div>
  );
}
