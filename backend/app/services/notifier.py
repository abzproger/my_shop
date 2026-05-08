import logging

import httpx

from app.core.config import get_settings
from app.models.order import OrderStatus
from app.schemas.order import OrderRead

logger = logging.getLogger(__name__)


def customer_order_status_message(order_id: int, status: OrderStatus) -> str | None:
    label = {
        OrderStatus.CONFIRMED: "подтверждён",
        OrderStatus.SHIPPED: "отправлен",
        OrderStatus.DELIVERED: "доставлен",
        OrderStatus.CANCELLED: "отменён",
    }.get(status)
    if label is None:
        return None
    return f"Заказ №{order_id} {label}."


async def notify_bot(
    *,
    admin_order: OrderRead | None = None,
    admin_note: str | None = None,
    customer: tuple[int, str] | None = None,
) -> None:
    settings = get_settings()
    if not settings.bot_internal_url:
        return

    body: dict = {}
    if admin_order is not None:
        body["admin_order"] = admin_order.model_dump(mode="json")
    if admin_note:
        body["admin_note"] = admin_note
    if customer is not None:
        body["customer"] = {"telegram_id": customer[0], "text": customer[1]}

    if not body:
        return

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(
                settings.bot_internal_url,
                json=body,
                headers={"X-Internal-Secret": settings.bot_internal_secret},
            )
            response.raise_for_status()
    except httpx.HTTPError:
        logger.exception("Failed to send notification to bot")
