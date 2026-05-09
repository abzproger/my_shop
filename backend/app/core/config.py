from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "My Shop API"
    api_prefix: str = "/api"
    database_url: str = "postgresql+asyncpg://shop:shop@db:5432/shop"
    jwt_secret: str = Field(default="change-me-to-a-long-random-secret", min_length=16)
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 60 * 24 * 7
    telegram_bot_token: str = ""
    telegram_auth_max_age_seconds: int = 60 * 60 * 24
    admin_telegram_ids: str = ""
    cors_origins: str = "http://localhost:3000"
    bot_internal_url: str = "http://bot:8081/internal/order-notification"
    bot_internal_secret: str = "change-me-internal-secret"
    media_root: str = "./media"
    media_url_prefix: str = "/media"

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("+asyncpg", "+psycopg")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def admin_id_set(self) -> set[int]:
        result: set[int] = set()
        for raw_id in self.admin_telegram_ids.split(","):
            raw_id = raw_id.strip()
            if raw_id:
                result.add(int(raw_id))
        return result


@lru_cache
def get_settings() -> Settings:
    return Settings()
