from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderItemRead, OrderRead


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


async def create_order(session: AsyncSession, user: User, payload: OrderCreate) -> Order:
    product_ids = {item.product_id for item in payload.items}
    result = await session.execute(
        select(Product)
        .where(Product.id.in_(product_ids), Product.is_active.is_(True))
        .options(selectinload(Product.images))
    )
    products = {product.id: product for product in result.scalars().all()}

    if len(products) != len(product_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more products are unavailable")

    total = Decimal("0.00")
    order_items: list[OrderItem] = []
    for requested_item in payload.items:
        product = products[requested_item.product_id]
        line_total = product.price * requested_item.quantity
        total += line_total
        order_items.append(
            OrderItem(
                product_id=product.id,
                quantity=requested_item.quantity,
                price=product.price,
            )
        )

    order = Order(
        user_id=user.id,
        status=OrderStatus.NEW,
        total_price=total,
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
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    return result.scalar_one()


async def get_order(session: AsyncSession, order_id: int) -> Order | None:
    result = await session.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    return result.scalar_one_or_none()
