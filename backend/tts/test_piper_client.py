"""Smoke tests for the Piper TTS voice-selection logic.

Validates that langdetect correctly routes Spanish and English text to the
appropriate Piper voice models, and that edge cases (empty input, markdown-only,
garbled text) fall back to the Spanish voice gracefully.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.tts.piper_client import select_voice


def test_spanish_returns_spanish_voice():
    """Spanish text should map to the Spanish Piper voice."""
    voice = select_voice("Hola, ¿cómo estás?")
    assert voice == "es_MX-claude-high", f"Expected es_MX-claude-high, got {voice}"


def test_english_returns_english_voice():
    """English text should map to the English Piper voice."""
    voice = select_voice("Hello, how are you doing today?")
    assert voice == "en_US-amy-medium", f"Expected en_US-amy-medium, got {voice}"


def test_empty_text_falls_back_to_spanish():
    """Empty input should fall back to the default Spanish voice."""
    voice = select_voice("")
    assert voice == "es_MX-claude-high", f"Expected es_MX-claude-high, got {voice}"


def test_markdown_only_text_falls_back_to_spanish():
    """Markdown-only input (stripped to empty) should fall back to Spanish."""
    voice = select_voice("###")
    assert voice == "es_MX-claude-high", f"Expected es_MX-claude-high, got {voice}"


def test_garbled_text_falls_back_to_spanish():
    """Non-linguistic text should fall back to Spanish when detection fails."""
    voice = select_voice("12345 !!! ???")
    assert voice == "es_MX-claude-high", f"Expected es_MX-claude-high, got {voice}"


if __name__ == "__main__":
    test_spanish_returns_spanish_voice()
    test_english_returns_english_voice()
    test_empty_text_falls_back_to_spanish()
    test_markdown_only_text_falls_back_to_spanish()
    test_garbled_text_falls_back_to_spanish()
    print("All select_voice tests passed.")
