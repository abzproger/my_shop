# My Shop

Прод-ориентированный шаблон e-commerce системы для продажи физических товаров с единым фронтендом для Telegram Mini App и обычного браузера.

## Архитектура

- `backend`: REST API на FastAPI, PostgreSQL как источник истины, проверка Telegram-подписей, JWT, каталог, заказы, админ API.
- `frontend`: Next.js App Router, Tailwind CSS, единый UI для web и Telegram Mini App.
- `bot`: интеграционный слой на aiogram + aiogram_dialog. Открывает Mini App и отправляет уведомления о заказах.
- `db`: PostgreSQL.

Бот не хранит состояние заказов и ничего не рассчитывает. Фронтенд только рендерит UI, хранит локальное состояние корзины и обращается к REST API. Цены, итоговые суммы, статусы, пользователи и админ-права хранятся на бэкенде.

## Модель авторизации

- Telegram Mini App отправляет `initData` в `POST /api/auth/telegram-mini-app`.
- В браузере вход выполняется через Telegram Login Widget, который отправляет подписанный payload в `POST /api/auth/telegram-login`.
- Бэкенд проверяет HMAC-подпись, создает/обновляет пользователя по `telegram_id` и возвращает JWT.
- Доступ в админку только через Telegram и регулируется списком `ADMIN_TELEGRAM_IDS`.

## Локальный запуск

1. Скопируйте `.env.example` в `.env`.
2. Заполните `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, `ADMIN_TELEGRAM_IDS`, `ADMIN_CHAT_ID`, `JWT_SECRET` и `BOT_INTERNAL_SECRET`.
3. Запустите проект:

```bash
docker compose up --build
```

Сервисы:

- Фронтенд: http://localhost:3000
- Backend API: http://localhost:8000
- Документация API: http://localhost:8000/docs
- Внутренний healthcheck бота: http://localhost:8081/health

## Продакшен-деплой (Timeweb VPS)

В репозиторий добавлены продакшен-конфиги с HTTPS reverse proxy:

- `docker-compose.prod.yml`
- `deploy/Caddyfile`
- `.env.prod.example`

### 1) Подготовка сервера

На чистом VPS от Timeweb (Ubuntu):

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

После этого перелогиньтесь один раз, чтобы Docker работал без `sudo`.

### 2) DNS и домен

Направьте домен (например, `shop.example.com`) на публичный IP сервера через `A`-запись.

### 3) Подготовка окружения

```bash
cp .env.prod.example .env.prod
```

Заполните `.env.prod` реальными значениями:

- `DOMAIN=shop.example.com`
- `POSTGRES_PASSWORD` — надежный пароль
- `TELEGRAM_BOT_TOKEN` — реальный токен бота
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — username бота без `@`
- `JWT_SECRET` и `BOT_INTERNAL_SECRET` — длинные случайные секреты
- `ADMIN_TELEGRAM_IDS` — ваши реальные Telegram ID
- `MINI_APP_URL=https://shop.example.com`
- `NEXT_PUBLIC_API_URL=https://shop.example.com/api`
- `CORS_ORIGINS=https://shop.example.com`

### 4) Настройка Telegram

В BotFather для того же бота:

- `/setdomain` -> `shop.example.com`
- `/setmenubutton` -> `https://shop.example.com`

Без валидного домена Telegram Login Widget в админке будет падать с ошибкой `Bot domain invalid`.

### 5) Запуск продакшен-стека

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Проверка контейнеров:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f
```

### 6) Обновление релиза

```bash
git pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

### 7) Чеклист безопасности

- Откройте во фаерволе VPS только порты `22`, `80`, `443`.
- Не публикуйте PostgreSQL и внутренние порты бота в интернет.
- Не добавляйте `.env.prod` в git.
- Ротируйте токен бота и секреты, если они могли быть скомпрометированы.

## Настройка Telegram

Для реального использования Mini App Telegram требует публичный HTTPS URL. Укажите его в `MINI_APP_URL`, настройте кнопку меню бота или открывайте приложение через `/start`.

Для локального тестирования в браузере используйте http://localhost:3000. Telegram-авторизация будет работать только если токен и username соответствуют реальному боту.

## Данные

Бэкенд при старте применяет миграции Alembic и сидирует небольшой каталог, если база данных пустая.

Основные таблицы:

- `users`
- `categories`
- `products`
- `product_images`
- `orders`
- `order_items`

Заказы, кроме обязательных статусов и итоговой суммы, содержат поля `phone`, `address` и `payment_method`.
