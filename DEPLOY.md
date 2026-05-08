# Деплой в продакшен (Caddy, TLS, Timeweb VPS)

Этот документ описывает **продакшен-стек** из [`docker-compose.prod.yml`](docker-compose.prod.yml): наружу торчат только **80** и **443** (Caddy). **PostgreSQL (5432), FastAPI (8000), Next.js (3000), внутренний HTTP бота (8081)** не публикуются — доступ только внутри Docker-сети.

## Что подготовить

1. **VPS** с Docker и Docker Compose (на Timeweb — тариф с Docker или установка вручную).
2. **Домен** в панели Timeweb (или у регистратора) — A-запись на публичный IP сервера.
3. **Файл окружения**: скопируйте [`.env.prod.example`](.env.prod.example) в `/.env` или в `/.env.prod` и заполните.
4. **Секреты**: не храните боевой `.env` в Git.

## Один домен (рекомендуется для Mini App)

- `PRIMARY_DOMAIN=shop.example.com`
- `MINI_APP_URL=https://shop.example.com`
- `NEXT_PUBLIC_API_URL=https://shop.example.com/api`
- `CORS_ORIGINS=https://shop.example.com`
- Caddy по умолчанию: [`caddy/Caddyfile`](caddy/Caddyfile) — всё с одного хоста, путь `/api*` уходит на бэкенд.

Цель Telegram Mini App — **один HTTPS origin** для фронта; так API остаётся того же сайта по пути `/api`, без отдельного CORS-поддомена.

## Два домена (фронт + API на поддомене)

В `.env`:

- `PRIMARY_DOMAIN=shop.example.com`
- `API_DOMAIN=api.shop.example.com`
- `NEXT_PUBLIC_API_URL=https://api.shop.example.com/api`
- `CORS_ORIGINS=https://shop.example.com`
- `CADDYFILE=./caddy/Caddyfile.subdomain`

В DNS нужны **две** A-записи на IP сервера.

## Локальная проверка без публичного DNS

1. В `.env`: `CADDYFILE=./caddy/Caddyfile.selfsigned`, `PRIMARY_DOMAIN=localhost`.
2. `NEXT_PUBLIC_API_URL` и `MINI_APP_URL` укажите как `https://localhost` (браузер покажет предупреждение о сертификате — это норм для internal CA).

Telegram Mini App с `localhost` **не** заведётся; это только проверка прокси и TLS.

## Запуск на сервере

```bash
# из корня репозитория
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Если переменные лежат в `.env` в том же каталоге, можно опустить `--env-file .env`.

Проверка:

- сайт: `https://$PRIMARY_DOMAIN`
- API: `https://$PRIMARY_DOMAIN/api/docs` (или `https://$API_DOMAIN/docs` в режиме subdomain)
- health бэкенда: `https://$PRIMARY_DOMAIN/health`

## Firewall (Timeweb VPS / ufw)

Откройте минимум:

- **22/tcp** — SSH (или свой порт)
- **80/tcp** — HTTP (нужен для ACME / редиректа Caddy)
- **443/tcp** — HTTPS

Закройте снаружи **5432, 3000, 8000, 8081** — в `docker-compose.prod.yml` для них нет `ports:`, но если когда‑нибудь поднимете dev-compose на том же хосте, не открывайте БД в интернет.

Пример с `ufw`:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Timeweb: краткий чеклист

1. Создать VPS, привязать домен (A → IP).
2. Установить Docker / Docker Compose (если не предустановлено).
3. Клонировать репозиторий, положить `.env`.
4. Запустить команду `docker compose -f docker-compose.prod.yml up -d --build`.
5. Дождаться выпуска сертификата (первый запуск Caddy; нужны открытые 80/443 и корректный DNS).
6. В BotFather выставить домен Mini App и **HTTPS** URL как `MINI_APP_URL`.
7. Убедиться, что `ADMIN_CHAT_ID` и токен бота заданы, бот может писать админу.

## Смена URL API / домена

- После смены **`NEXT_PUBLIC_*`** пересоберите образ **frontend**.
- Обновите **`CORS_ORIGINS`** и **`MINI_APP_URL`** на бэкенде/боте при смене публичного адреса фронта.

## Тома и бэкапы

- Данные PostgreSQL: том `postgres_data`.
- Сертификаты Caddy: том `caddy_data`.

Регулярно делайте бэкап БД (`pg_dump`) или снапшоты по политике хостинга.
