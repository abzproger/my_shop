from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.jwt import create_access_token
from app.db.session import get_session
from app.models.user import User
from app.schemas.auth import TelegramLoginAuthRequest, TelegramMiniAppAuthRequest, TokenResponse, UserRead
from app.services.telegram_auth import verify_login_widget, verify_mini_app_init_data
from app.services.users import upsert_telegram_user

router = APIRouter(prefix="/auth", tags=["auth"])


def build_token_response(user: User) -> TokenResponse:
    is_admin = user.telegram_id in get_settings().admin_id_set
    return TokenResponse(
        access_token=create_access_token(user),
        user=UserRead.model_validate(user).model_copy(update={"is_admin": is_admin}),
    )


@router.post("/telegram-mini-app", response_model=TokenResponse)
async def telegram_mini_app_auth(
    payload: TelegramMiniAppAuthRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    telegram_user = verify_mini_app_init_data(payload.init_data)
    user = await upsert_telegram_user(session, telegram_user)
    return build_token_response(user)


@router.post("/telegram-login", response_model=TokenResponse)
async def telegram_login_auth(
    payload: TelegramLoginAuthRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    telegram_user = verify_login_widget(payload)
    user = await upsert_telegram_user(session, telegram_user)
    return build_token_response(user)


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)) -> UserRead:
    is_admin = user.telegram_id in get_settings().admin_id_set
    return UserRead.model_validate(user).model_copy(update={"is_admin": is_admin})
