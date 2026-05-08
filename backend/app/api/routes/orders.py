from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderCreate, OrderPreviewRequest, OrderPreviewResponse, OrderRead
from app.services.notifier import notify_bot
from app.services.orders import (
    cancel_order_by_customer,
    create_order,
    get_user_order,
    order_to_read,
    preview_order,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/preview", response_model=OrderPreviewResponse)
async def preview_cart(payload: OrderPreviewRequest, session: AsyncSession = Depends(get_session)) -> OrderPreviewResponse:
    return await preview_order(session, payload)


@router.post("", response_model=OrderRead, status_code=201)
async def create_user_order(
    payload: OrderCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> OrderRead:
    order = await create_order(session, user, payload)
    response = order_to_read(order)
    customer_text = (
        f"Заказ №{response.id} принят. Сумма: {response.total_price} ₽. "
        "Статус можно отслеживать в разделе «Мои заказы»."
    )
    await notify_bot(admin_order=response, customer=(user.telegram_id, customer_text))
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


@router.get("/{order_id}", response_model=OrderRead)
async def get_user_order_detail(
    order_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> OrderRead:
    order = await get_user_order(session, order_id, user)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")
    return order_to_read(order)


@router.post("/{order_id}/cancel", response_model=OrderRead)
async def cancel_my_order(
    order_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> OrderRead:
    order = await get_user_order(session, order_id, user)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")
    updated = await cancel_order_by_customer(session, order)
    response = order_to_read(updated)
    customer_text = f"Заказ №{response.id} отменён."
    admin_note = f"Покупатель отменил заказ №{response.id}."
    await notify_bot(customer=(user.telegram_id, customer_text), admin_note=admin_note)
    return response
