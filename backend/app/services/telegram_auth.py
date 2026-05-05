import hashlib
import hmac
import json
import time
from typing import Any
from urllib.parse import parse_qsl

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas.auth import TelegramLoginAuthRequest


def _ensure_bot_token() -> str:
    token = get_settings().telegram_bot_token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Telegram bot token is not configured",
        )
    return token


def _validate_auth_date(auth_date: str | int) -> None:
    try:
        value = int(auth_date)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth_date") from exc

    max_age = get_settings().telegram_auth_max_age_seconds
    if int(time.time()) - value > max_age:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Telegram auth data expired")


def verify_mini_app_init_data(init_data: str) -> dict[str, Any]:
    bot_token = _ensure_bot_token()
    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Telegram hash")

    _validate_auth_date(parsed.get("auth_date", "0"))

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Telegram signature")

    user_raw = parsed.get("user")
    if not user_raw:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Telegram user")

    try:
        user = json.loads(user_raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Telegram user payload") from exc

    if "id" not in user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Telegram user id is missing")

    return user


def verify_login_widget(auth_data: TelegramLoginAuthRequest) -> dict[str, Any]:
    bot_token = _ensure_bot_token()
    payload = auth_data.model_dump(exclude_none=True)
    received_hash = payload.pop("hash")

    _validate_auth_date(payload.get("auth_date", 0))

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(payload.items()))
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Telegram signature")

    return payload
