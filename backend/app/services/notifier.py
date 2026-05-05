import logging

import httpx

from app.core.config import get_settings
from app.schemas.order import OrderRead

logger = logging.getLogger(__name__)


async def notify_order_created(order: OrderRead) -> None:
    settings = get_settings()
    if not settings.bot_internal_url:
        return

    payload = order.model_dump(mode="json")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(
                settings.bot_internal_url,
                json=payload,
                headers={"X-Internal-Secret": settings.bot_internal_secret},
            )
            response.raise_for_status()
    except httpx.HTTPError:
        logger.exception("Failed to send order notification to bot")
