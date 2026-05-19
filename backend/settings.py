"""Centralised application settings loaded from environment variables and .env.

Uses pydantic-settings to parse and validate configuration. The LLM section
implements a two-tier fallback: generic LLM_* variables take priority over
legacy DEEPSEEK_* values, so operators can swap providers without touching code.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the TravelBuddy backend.

    All fields map 1:1 to environment variables. Defaults are development-safe;
    production deployments should override at least the API keys.
    """

    # ── Generic LLM provider (OpenAI-compatible API) ──────────────────────────
    # Set these to use any provider (Groq, Together, OpenRouter, etc.).
    # If left empty, the DEEPSEEK_* values below are used as fallback.
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = ""
    LLM_MODEL: str = ""

    # ── Legacy DeepSeek settings (backwards compatible) ───────────────────────
    # These are used when LLM_* is not set.
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-chat"

    # ── TTS ───────────────────────────────────────────────────────────────────
    PIPER_VOICE_ES: str = "es_MX-claude-high"
    PIPER_VOICE_EN: str = "en_US-amy-medium"
    PIPER_VOICES_DIR: str = "/data/voices"

    # ── Web search ────────────────────────────────────────────────────────────
    # Tavily API key (free 1k searches/month at https://tavily.com)
    TAVILY_API_KEY: str = ""

    # ── RAG ───────────────────────────────────────────────────────────────────
    CHROMA_DIR: str = "/data/chroma"
    RAG_SOURCE_URL: str = ""

    # ── API ───────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    MEMORY_WINDOW: int = 7

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── Effective LLM properties ──────────────────────────────────────────────

    @property
    def effective_api_key(self) -> str:
        """Resolve the API key: prefer LLM_API_KEY, fall back to DEEPSEEK_API_KEY."""
        return self.LLM_API_KEY or self.DEEPSEEK_API_KEY

    @property
    def effective_base_url(self) -> str:
        """Resolve the base URL: prefer LLM_BASE_URL, fall back to DEEPSEEK_BASE_URL."""
        return self.LLM_BASE_URL or self.DEEPSEEK_BASE_URL

    @property
    def effective_model(self) -> str:
        """Resolve the model name: prefer LLM_MODEL, fall back to DEEPSEEK_MODEL."""
        return self.LLM_MODEL or self.DEEPSEEK_MODEL

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse the comma-separated ALLOWED_ORIGINS string into a list for CORS middleware."""
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
