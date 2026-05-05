from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def upsert_telegram_user(session: AsyncSession, telegram_user: dict[str, Any]) -> User:
    telegram_id = int(telegram_user["id"])
    result = await session.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(telegram_id=telegram_id)
        session.add(user)

    user.username = telegram_user.get("username")
    user.first_name = telegram_user.get("first_name")
    user.last_name = telegram_user.get("last_name")

    await session.commit()
    await session.refresh(user)
    return user
