"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { money, paymentLabel, statusLabel } from "@/lib/format";
import type { Order } from "@/types/shop";

function orderCanCancel(status: string): boolean {
  return status === "NEW" || status === "CONFIRMED";
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);
  const { initialized, token, user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!token || !Number.isFinite(orderId)) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    api
      .order(token, orderId)
      .then((o) => {
        if (active) setOrder(o);
      })
      .catch((e) => {
        if (active) setError(e instanceof ApiError ? e.message : "Заказ не найден");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, orderId]);

  async function cancel() {
    if (!token || !order || !orderCanCancel(order.status)) return;
    setCancelling(true);
    setError(null);
    try {
      const updated = await api.cancelOrder(token, order.id);
      setOrder(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось отменить заказ");
    } finally {
      setCancelling(false);
    }
  }

  if (!initialized) {
    return <div className="h-40 animate-pulse rounded-lg bg-black/10" />;
  }

  if (!user) {
    return (
      <section className="space-y-4 rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold">Заказ</h1>
        <TelegramLoginButton />
      </section>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-ink/60">
        <Loader2 className="animate-spin" size={20} aria-hidden />
        <span>Загрузка…</span>
      </div>
    );
  }

  if (error && !order) {
    return (
      <section className="space-y-4 rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <p className="text-coral" role="alert">
          {error}
        </p>
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-medium text-moss">
          <ArrowLeft size={16} aria-hidden /> К списку заказов
        </Link>
      </section>
    );
  }

  if (!order) return null;

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="inline-flex items-center gap-2 text-sm font-medium text-moss"
        >
          <ArrowLeft size={16} aria-hidden /> Назад
        </button>
      </div>

      <header className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold">Заказ №{order.id}</h1>
        <p className="mt-1 text-sm text-ink/65">
          {new Date(order.created_at).toLocaleString("ru-RU")} · {statusLabel(order.status)}
        </p>
        {error ? (
          <p className="mt-3 rounded-lg bg-coral/10 p-3 text-sm text-coral" role="alert">
            {error}
          </p>
        ) : null}
      </header>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Состав</h2>
        <ul className="mt-3 space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span className="shrink-0 font-medium">{money(Number(item.price) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-black/10 pt-4 text-lg font-semibold">
          <span>Итого</span>
          <span>{money(order.total_price)}</span>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Доставка и оплата</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-ink/55">Телефон</dt>
            <dd className="font-medium">{order.phone}</dd>
          </div>
          <div>
            <dt className="text-ink/55">Адрес</dt>
            <dd className="font-medium whitespace-pre-wrap">{order.address}</dd>
          </div>
          <div>
            <dt className="text-ink/55">Оплата</dt>
            <dd className="font-medium">{paymentLabel(order.payment_method)}</dd>
          </div>
        </dl>
      </section>

      {orderCanCancel(order.status) ? (
        <div className="rounded-lg border border-black/10 bg-paper p-4">
          <p className="text-sm text-ink/70">
            Пока заказ не отправлен, вы можете отменить его. После отмены восстановить заказ нельзя.
          </p>
          <button
            type="button"
            disabled={cancelling}
            onClick={cancel}
            className="mt-3 h-11 rounded-lg border border-coral px-4 text-sm font-semibold text-coral hover:bg-coral/10 disabled:opacity-60"
          >
            {cancelling ? "Отмена…" : "Отменить заказ"}
          </button>
        </div>
      ) : null}
    </article>
  );
}
