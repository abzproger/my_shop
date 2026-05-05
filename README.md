# My Shop

Production-oriented skeleton for a physical-goods e-commerce system with one shared frontend for Telegram Mini App and regular browser use.

## Architecture

- `backend`: FastAPI REST API, PostgreSQL source of truth, Telegram signature verification, JWT, catalog, orders, admin API.
- `frontend`: Next.js App Router, Tailwind CSS, one UI for web and Telegram Mini App.
- `bot`: aiogram + aiogram_dialog integration layer. It opens the Mini App and delivers order notifications.
- `db`: PostgreSQL.

The bot does not store order state and does not calculate anything. The frontend only renders UI, keeps local cart UI state, and calls REST endpoints. Prices, order totals, statuses, users, and admin permissions live on the backend.

## Auth Model

- Telegram Mini App sends `initData` to `POST /api/auth/telegram-mini-app`.
- Browser login uses Telegram Login Widget and sends the signed payload to `POST /api/auth/telegram-login`.
- Backend verifies HMAC signatures, upserts one user by `telegram_id`, and returns a JWT.
- Admin access is Telegram-only and controlled by `ADMIN_TELEGRAM_IDS`.

## Run Locally

1. Copy `.env.example` to `.env`.
2. Fill `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, `ADMIN_TELEGRAM_IDS`, `ADMIN_CHAT_ID`, `JWT_SECRET`, and `BOT_INTERNAL_SECRET`.
3. Start everything:

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs
- Bot internal health: http://localhost:8081/health

## Telegram Setup

For real Mini App usage Telegram requires a public HTTPS URL. Set `MINI_APP_URL` to that URL and configure the bot's menu button or open the app from `/start`.

For local browser testing, use http://localhost:3000. Telegram auth will only work when the bot token and widget username match the real bot.

## Data

The backend runs Alembic migrations on startup and seeds a small catalog if the database is empty.

Core tables:

- `users`
- `categories`
- `products`
- `product_images`
- `orders`
- `order_items`

Orders include `phone`, `address`, and `payment_method` in addition to the required status and total fields.
