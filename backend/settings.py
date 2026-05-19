"""Application configuration loaded from environment variables / .env file.

All settings are typed and validated via pydantic-settings.  Sensible defaults are
provided for every field except DEEPSEEK_API_KEY, which must be supplied explicitly.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings sourced from environment variables and a .env file."""

    DEEPSEEK_API_KEY: str
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    PIPER_VOICE_ES: str = "es_MX-claude-high"
    PIPER_VOICE_EN: str = "en_US-amy-medium"
    PIPER_VOICES_DIR: str = "/data/voices"
    CHROMA_DIR: str = "/data/chroma"
    RAG_SOURCE_URL: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    MEMORY_WINDOW: int = 7

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins_list(self) -> list[str]:
        """Split the comma-separated ALLOWED_ORIGINS string into a clean list."""
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
