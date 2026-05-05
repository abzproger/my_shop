from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead
from app.services.notifier import notify_order_created
from app.services.orders import create_order, order_to_read

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderRead, status_code=201)
async def create_user_order(
    payload: OrderCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> OrderRead:
    order = await create_order(session, user, payload)
    response = order_to_read(order)
    await notify_order_created(response)
    return response


@router.get("", response_model=list[OrderRead])
async def list_user_orders(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[OrderRead]:
    result = await session.execute(
        select(Order)
        .where(Order.user_id == user.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    return [order_to_read(order) for order in result.scalars().unique().all()]
