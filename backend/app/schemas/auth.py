from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TelegramMiniAppAuthRequest(BaseModel):
    init_data: str = Field(min_length=1)


class TelegramLoginAuthRequest(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    auth_date: int
    hash: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    telegram_id: int
    username: str | None
    first_name: str | None
    last_name: str | None
    created_at: datetime
    is_admin: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TokenPayload(BaseModel):
    sub: int
    telegram_id: int
    exp: int
