from datetime import UTC, datetime, timedelta

import jwt
from fastapi import HTTPException, status
from jwt import InvalidTokenError

from app.core.config import get_settings
from app.models.user import User
from app.schemas.auth import TokenPayload


def create_access_token(user: User) -> str:
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_minutes)
    payload = {
        "sub": str(user.id),
        "telegram_id": user.telegram_id,
        "exp": int(expires_at.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> TokenPayload:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return TokenPayload(**payload)
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) from exc
