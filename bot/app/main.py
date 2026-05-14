import asyncio
import html
import logging
from typing import Any

from aiohttp import web
from aiogram import Bot, Dispatcher, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, ReplyKeyboardRemove, WebAppInfo
from aiogram_dialog import Dialog, DialogManager, StartMode, Window, setup_dialogs
from aiogram_dialog.widgets.kbd import Url
from aiogram_dialog.widgets.text import Const

from app.config import Settings, get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = Router()


class StartSG(StatesGroup):
    main = State()


def build_start_dialog(settings: Settings) -> Dialog:
    return Dialog(
        Window(
            Const("Магазин готов к заказам. Откройте каталог в Mini App или в браузере."),
            Url(Const("Веб-каталог"), Const(settings.mini_app_url)),
            state=StartSG.main,
        )
    )


@router.message(CommandStart())
async def start(message: Message, dialog_manager: DialogManager) -> None:
    settings = get_settings()
    web_app = WebAppInfo(url=settings.mini_app_url)
    inline_markup = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="Открыть Mini App", web_app=web_app)]]
    )

    await message.answer("Нажмите кнопку ниже, чтобы открыть магазин.", reply_markup=ReplyKeyboardRemove())
    await message.answer("Каталог, корзина и оформление заказа доступны в одном интерфейсе.", reply_markup=inline_markup)
    await dialog_manager.start(StartSG.main, mode=StartMode.RESET_STACK)


def payment_label(value: str) -> str:
    return {"CASH": "наличные", "TRANSFER": "перевод"}.get(value, value)


def format_order(payload: dict[str, Any]) -> str:
    items = payload.get("items", [])
    item_lines = []
    for item in items:
        name = html.escape(str(item.get("product_name", "Товар")))
        quantity = html.escape(str(item.get("quantity", "")))
        price = html.escape(str(item.get("price", "")))
        item_lines.append(f"• {name} x {quantity} · {price}")

    lines = [
        f"<b>Новый заказ #{html.escape(str(payload.get('id', '')))}</b>",
        f"Сумма: <b>{html.escape(str(payload.get('total_price', '')))}</b>",
        f"Оплата: {html.escape(payment_label(str(payload.get('payment_method', ''))))}",
        f"Телефон: {html.escape(str(payload.get('phone', '')))}",
        f"Адрес: {html.escape(str(payload.get('address', '')))}",
    ]
    if item_lines:
        lines.append("")
        lines.append("<b>Состав:</b>")
        lines.extend(item_lines)
    return "\n".join(lines)


async def handle_order_notification(request: web.Request) -> web.Response:
    settings = get_settings()
    if request.headers.get("X-Internal-Secret") != settings.bot_internal_secret:
        return web.json_response({"detail": "Forbidden"}, status=403)

    payload = await request.json()
    bot: Bot = request.app["bot"]

    if settings.admin_chat_id is None:
        if payload.get("admin_order") or payload.get("admin_note"):
            logger.warning("ADMIN_CHAT_ID is not configured; admin notifications skipped")
    else:
        if admin_order := payload.get("admin_order"):
            await bot.send_message(settings.admin_chat_id, format_order(admin_order))
        if note := payload.get("admin_note"):
            await bot.send_message(settings.admin_chat_id, html.escape(str(note)))

    if customer := payload.get("customer"):
        tid = customer.get("telegram_id")
        text = customer.get("text")
        if tid is not None and text:
            try:
                plain = html.escape(str(text))
                await bot.send_message(int(tid), plain, parse_mode=ParseMode.HTML)
            except Exception:
                logger.exception("Failed to notify customer via Telegram")

    return web.json_response({"ok": True})


async def start_internal_server(bot: Bot, settings: Settings) -> web.AppRunner:
    app = web.Application()
    app["bot"] = bot
    app.router.add_post("/internal/order-notification", handle_order_notification)
    app.router.add_get("/health", lambda request: web.json_response({"status": "ok"}))

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, settings.bot_internal_host, settings.bot_internal_port)
    await site.start()
    logger.info("Bot internal server is listening on %s:%s", settings.bot_internal_host, settings.bot_internal_port)
    return runner


async def main() -> None:
    settings = get_settings()
    bot = Bot(settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher()
    dp.include_router(router)
    dp.include_router(build_start_dialog(settings))
    setup_dialogs(dp)

    runner = await start_internal_server(bot, settings)
    try:
        await dp.start_polling(bot)
    finally:
        await runner.cleanup()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
