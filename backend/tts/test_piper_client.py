import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.tts.piper_client import select_voice


def test_spanish_returns_spanish_voice():
    voice = select_voice("Hola, ¿cómo estás?")
    assert voice == "es_MX-claude-high", f"Expected es_MX-claude-high, got {voice}"


def test_english_returns_english_voice():
    voice = select_voice("Hello, how are you doing today?")
    assert voice == "en_US-amy-medium", f"Expected en_US-amy-medium, got {voice}"


def test_empty_text_falls_back_to_spanish():
    voice = select_voice("")
    assert voice == "es_MX-claude-high", f"Expected es_MX-claude-high, got {voice}"


def test_markdown_only_text_falls_back_to_spanish():
    voice = select_voice("###")
    assert voice == "es_MX-claude-high", f"Expected es_MX-claude-high, got {voice}"


def test_garbled_text_falls_back_to_spanish():
    voice = select_voice("12345 !!! ???")
    assert voice == "es_MX-claude-high", f"Expected es_MX-claude-high, got {voice}"


if __name__ == "__main__":
    test_spanish_returns_spanish_voice()
    test_english_returns_english_voice()
    test_empty_text_falls_back_to_spanish()
    test_markdown_only_text_falls_back_to_spanish()
    test_garbled_text_falls_back_to_spanish()
    print("All select_voice tests passed.")
