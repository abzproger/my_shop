from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderItemRead,
    OrderPreviewLine,
    OrderPreviewRequest,
    OrderPreviewResponse,
    OrderRead,
)

PRODUCTS_UNAVAILABLE_MSG = (
    "Некоторые товары недоступны или сняты с продажи. Удалите их из корзины и попробуйте снова."
)


def order_to_read(order: Order) -> OrderRead:
    return OrderRead(
        id=order.id,
        status=order.status,
        total_price=order.total_price,
        phone=order.phone,
        address=order.address,
        payment_method=order.payment_method,
        created_at=order.created_at,
        items=[
            OrderItemRead(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                quantity=item.quantity,
                price=item.price,
            )
            for item in order.items
        ],
    )


async def preview_order(session: AsyncSession, payload: OrderPreviewRequest) -> OrderPreviewResponse:
    product_ids = {item.product_id for item in payload.items}
    result = await session.execute(
        select(Product)
        .where(Product.id.in_(product_ids), Product.is_active.is_(True))
        .options(selectinload(Product.images))
    )
    products = {product.id: product for product in result.scalars().all()}

    if len(products) != len(product_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=PRODUCTS_UNAVAILABLE_MSG)

    lines: list[OrderPreviewLine] = []
    total = Decimal("0.00")
    for requested_item in payload.items:
        product = products[requested_item.product_id]
        line_total = product.price * requested_item.quantity
        total += line_total
        lines.append(
            OrderPreviewLine(
                product_id=product.id,
                product_name=product.name,
                quantity=requested_item.quantity,
                unit_price=product.price,
                line_total=line_total,
            )
        )

    return OrderPreviewResponse(items=lines, total_price=total)


async def create_order(session: AsyncSession, user: User, payload: OrderCreate) -> Order:
    preview = await preview_order(session, OrderPreviewRequest(items=payload.items))
    order_items = [
        OrderItem(
            product_id=line.product_id,
            quantity=line.quantity,
            price=line.unit_price,
        )
        for line in preview.items
    ]

    order = Order(
        user_id=user.id,
        status=OrderStatus.NEW,
        total_price=preview.total_price,
        phone=payload.phone,
        address=payload.address,
        payment_method=payload.payment_method,
        items=order_items,
    )
    session.add(order)
    await session.commit()

    result = await session.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
    )
    return result.scalar_one()


async def get_order(session: AsyncSession, order_id: int) -> Order | None:
    result = await session.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
    )
    return result.scalar_one_or_none()


async def get_user_order(session: AsyncSession, order_id: int, user: User) -> Order | None:
    order = await get_order(session, order_id)
    if order is None or order.user_id != user.id:
        return None
    return order


def order_cancellable_by_customer(order: Order) -> bool:
    return order.status in (OrderStatus.NEW, OrderStatus.CONFIRMED)


async def cancel_order_by_customer(session: AsyncSession, order: Order) -> Order:
    if not order_cancellable_by_customer(order):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот заказ уже нельзя отменить (отправлен, доставлен или уже отменён).",
        )
    order.status = OrderStatus.CANCELLED
    await session.commit()
    refreshed = await get_order(session, order.id)
    assert refreshed is not None
    return refreshed
