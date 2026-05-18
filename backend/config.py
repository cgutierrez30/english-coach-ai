from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    anthropic_api_key: str = ""
    openai_api_key: str = ""
    database_url: str = "sqlite:///./dev.db"
    secret_key: str = "dev-secret-change-me"
    anthropic_model: str = "claude-sonnet-4-20250514"


settings = Settings()
