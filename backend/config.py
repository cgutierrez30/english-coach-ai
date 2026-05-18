from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Project root is one level above backend/
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent

# Load root .env first, then optional backend/.env override
load_dotenv(ROOT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env", override=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(ROOT_DIR / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    anthropic_api_key: str = ""
    openai_api_key: str = ""
    database_url: str = "sqlite:///./dev.db"
    secret_key: str = "dev-secret-change-me"
    anthropic_model: str = "claude-sonnet-4-20250514"

    @property
    def anthropic_configured(self) -> bool:
        key = self.anthropic_api_key.strip()
        if not key:
            return False
        placeholders = {"your_key_here", "changeme", "xxx", "placeholder"}
        if key.lower() in placeholders or key.lower().startswith("your_"):
            return False
        return True


settings = Settings()
