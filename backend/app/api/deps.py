from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_session
from app.models.user import User


async def get_current_user(request: Request, session: AsyncSession = Depends(get_session)) -> User:
    user_id = getattr(request.state, "user_id", None)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    user = await session.get(User, int(user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if user.telegram_id not in get_settings().admin_id_set:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
