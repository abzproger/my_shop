"use client";

import { ClipboardList, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { money, statusLabel } from "@/lib/format";
import type { Order } from "@/types/shop";

export default function OrdersPage() {
  const { initialized, token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError(null);
    api
      .orders(token)
      .then((list) => {
        if (active) setOrders(list);
      })
      .catch((e) => {
        if (active) setError(e instanceof ApiError ? e.message : "Не удалось загрузить заказы");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (!initialized) {
    return <div className="h-40 animate-pulse rounded-lg bg-black/10" />;
  }

  if (!user) {
    return (
      <section className="space-y-4 rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-moss/15 text-moss">
            <ClipboardList size={22} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Мои заказы</h1>
            <p className="text-sm text-ink/65">Войдите через Telegram, чтобы видеть историю</p>
          </div>
        </div>
        <TelegramLoginButton />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-moss/15 text-moss">
          <ClipboardList size={22} aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Мои заказы</h1>
          <p className="text-sm text-ink/65">Все оформленные вами заказы</p>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-coral/10 p-3 text-sm text-coral" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-ink/60">
          <Loader2 className="animate-spin" size={20} aria-hidden />
          <span>Загрузка…</span>
        </div>
      ) : null}

      {!loading && orders.length === 0 ? (
        <div className="rounded-lg border border-black/10 bg-white p-6 text-center shadow-soft">
          <p className="text-ink/70">Заказов пока нет</p>
          <Link
            href="/"
            className="mt-4 inline-flex h-11 items-center rounded-lg bg-ink px-5 text-sm font-semibold text-white"
          >
            В каталог
          </Link>
        </div>
      ) : null}

      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/orders/${order.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-soft transition hover:border-moss/40"
            >
              <div>
                <span className="font-semibold">Заказ №{order.id}</span>
                <p className="text-sm text-ink/60">{new Date(order.created_at).toLocaleString("ru-RU")}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{money(order.total_price)}</p>
                <p className="text-sm text-ink/60">{statusLabel(order.status)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
