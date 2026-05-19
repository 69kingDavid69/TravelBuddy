/**
 * Renders an HTML5 audio player for TTS-generated audio blobs.
 * Returns nothing when no audio URL is available (e.g., in text mode
 * or before the TTS response arrives).
 */
export default function AudioPlayer({ audioUrl }) {
  /** Avoid rendering an empty audio element when no audio is available. */
  if (!audioUrl) return null;

  return (
    <div className="mt-2">
      {/**
       * autoPlay is enabled so the TTS response plays immediately
       * in voice mode without requiring a manual click.
       */}
      <audio controls autoPlay className="w-full h-8">
        <source src={audioUrl} type="audio/wav" />
      </audio>
    </div>
  );
}
