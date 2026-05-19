export default function AudioPlayer({ audioUrl }) {
  if (!audioUrl) return null;

  return (
    <div className="mt-2">
      <audio controls autoPlay className="w-full h-8">
        <source src={audioUrl} type="audio/wav" />
      </audio>
    </div>
  );
}
