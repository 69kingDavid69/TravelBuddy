import io
import json
import os
import re
import subprocess
import sys
import wave

from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

from backend.settings import settings

DetectorFactory.seed = 0


def _piper_cmd() -> list[str]:
    """Return the piper command. Prefers the piper-tts Python wrapper."""
    python_exe = sys.executable
    venv_piper = os.path.join(os.path.dirname(python_exe), "piper")
    if os.path.isfile(venv_piper) and os.access(venv_piper, os.X_OK):
        return [venv_piper]
    return ["piper"]


def _strip_markdown(text: str) -> str:
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"[*_`#>]+", "", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def select_voice(text: str) -> str:
    """Return the Piper voice filename (without extension) matching the detected language."""
    cleaned = _strip_markdown(text)
    if not cleaned:
        return settings.PIPER_VOICE_ES
    try:
        lang = detect(cleaned)
        if lang == "en":
            return settings.PIPER_VOICE_EN
    except LangDetectException:
        pass
    return settings.PIPER_VOICE_ES


def _get_sample_rate(voice_name: str) -> int:
    config_path = os.path.join(settings.PIPER_VOICES_DIR, f"{voice_name}.onnx.json")
    try:
        with open(config_path) as fh:
            cfg = json.load(fh)
        return int(cfg["audio"]["sample_rate"])
    except Exception:
        return 22050


def _pcm_to_wav(pcm: bytes, sample_rate: int) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm)
    return buf.getvalue()


def synthesize(text: str) -> tuple[bytes, str]:
    """Run Piper TTS and return (wav_bytes, voice_name)."""
    voice = select_voice(text)
    clean_text = _strip_markdown(text)
    if not clean_text:
        raise ValueError("Text is empty after stripping markdown")

    model_path = os.path.join(settings.PIPER_VOICES_DIR, f"{voice}.onnx")
    proc = subprocess.run(
        _piper_cmd() + ["--model", model_path, "--output_raw"],
        input=clean_text.encode("utf-8"),
        capture_output=True,
        timeout=60,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Piper failed: {proc.stderr.decode('utf-8', errors='replace')}")

    sample_rate = _get_sample_rate(voice)
    wav_bytes = _pcm_to_wav(proc.stdout, sample_rate)
    return wav_bytes, voice
