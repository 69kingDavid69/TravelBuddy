import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icons } from "../lib/icons.jsx";

/**
 * Audio player driven by a real <audio> element under the hood. Receives the
 * blob URL from /tts and renders a stylised waveform whose progress tracks
 * audio.currentTime. The waveform is decorative — the static bar heights are
 * deterministic so the visual is stable across renders.
 */
export default function AudioPlayer({ src, voice, t }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      if (!el.duration || !isFinite(el.duration)) return;
      setProgress(el.currentTime / el.duration);
    };
    const onLoaded = () => setDuration(el.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setProgress(1); };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    // Autoplay the freshly-generated reply, mirroring voice-assistant UX.
    el.play().catch(() => { /* autoplay blocked — user can click play */ });
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.ended) el.currentTime = 0;
    if (el.paused) el.play(); else el.pause();
  };

  const bars = useMemo(
    () => Array.from({ length: 42 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 0.6 + 1)) * 0.75),
    []
  );

  const elapsed = (progress * (duration || 0)).toFixed(1);

  return (
    <div className="tb-audio">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button className="tb-audio-btn" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
        {playing ? <Icons.Pause size={12} /> : <Icons.Play size={12} />}
      </button>
      <div className="tb-wave" aria-hidden="true">
        {bars.map((h, i) => {
          const filled = i / bars.length <= progress;
          return (
            <span
              key={i}
              className={`tb-wave-bar ${filled ? "is-filled" : ""} ${playing ? "is-playing" : ""}`}
              style={{ height: `${h * 100}%`, animationDelay: `${i * 30}ms` }}
            />
          );
        })}
      </div>
      <span className="tb-audio-time">{elapsed}s</span>
      {voice && (
        <span className="tb-audio-voice" title={t("voiceLabel")}>
          <Icons.Volume size={11} /> {voice}
        </span>
      )}
    </div>
  );
}
