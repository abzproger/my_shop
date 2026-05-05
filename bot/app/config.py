from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    bot_token: str
    mini_app_url: str = "http://localhost:3000"
    admin_chat_id: int | None = None
    bot_internal_secret: str = "change-me-internal-secret"
    bot_internal_host: str = "0.0.0.0"
    bot_internal_port: int = 8081

    @field_validator("admin_chat_id", mode="before")
    @classmethod
    def empty_admin_chat_id_to_none(cls, value: object) -> object:
        return None if value == "" else value


@lru_cache
def get_settings() -> Settings:
    return Settings()
