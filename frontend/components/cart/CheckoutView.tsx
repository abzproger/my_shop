"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import clsx from "clsx";

import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { money, paymentLabel, statusLabel } from "@/lib/format";
import type { Order, PaymentMethod } from "@/types/shop";

const paymentMethods: PaymentMethod[] = ["CASH", "TRANSFER"];

export function CheckoutView() {
  const { initialized, token, user } = useAuth();
  const { items, total, clear } = useCart();
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || items.length === 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const order = await api.createOrder(token, {
        items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
        phone,
        address,
        payment_method: paymentMethod
      });
      setCreatedOrder(order);
      clear();
    } catch {
      setError("Не удалось создать заказ");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdOrder) {
    return (
      <section className="grid min-h-[50vh] place-items-center rounded-lg border border-black/10 bg-white p-6 text-center shadow-soft">
        <div className="max-w-sm space-y-4">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-moss/15 text-moss">
            <CheckCircle2 size={26} aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold">Заказ #{createdOrder.id} создан</h1>
          <p className="text-ink/65">Статус: {statusLabel(createdOrder.status)}</p>
          <Link href="/" className="inline-flex h-11 items-center rounded-lg bg-ink px-5 text-sm font-semibold text-white">
            В каталог
          </Link>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold">Корзина пуста</h1>
        <Link href="/" className="mt-4 inline-flex h-11 items-center rounded-lg bg-ink px-5 text-sm font-semibold text-white">
          Каталог
        </Link>
      </section>
    );
  }

  if (!initialized) {
    return <div className="h-40 animate-pulse rounded-lg bg-black/10" />;
  }

  if (!user) {
    return (
      <section className="space-y-4 rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold">Вход</h1>
        <TelegramLoginButton />
      </section>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-black/10 bg-white p-4 shadow-soft">
        <h1 className="text-2xl font-semibold">Оформление</h1>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Телефон</span>
          <input
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-12 w-full rounded-lg border border-black/10 bg-paper px-3 outline-none focus:border-moss"
            placeholder="+7"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Адрес</span>
          <textarea
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border border-black/10 bg-paper px-3 py-3 outline-none focus:border-moss"
          />
        </label>
        <div className="space-y-2">
          <span className="text-sm font-medium">Оплата</span>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={clsx(
                  "h-11 rounded-lg border text-sm font-semibold",
                  paymentMethod === method ? "border-ink bg-ink text-white" : "border-black/10 bg-paper text-ink"
                )}
              >
                {paymentLabel(method)}
              </button>
            ))}
          </div>
        </div>
        {error ? <p className="rounded-lg bg-coral/10 p-3 text-sm text-coral">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-moss px-4 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? <Loader2 className="animate-spin" size={18} aria-hidden /> : null}
          Создать заказ
        </button>
      </form>

      <aside className="h-fit rounded-lg border border-black/10 bg-white p-4 shadow-soft">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between gap-3 text-sm">
              <span className="line-clamp-2">{item.name} x {item.quantity}</span>
              <span className="shrink-0 font-semibold">{money(Number(item.price) * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
          <span className="font-medium">Итого</span>
          <span className="text-xl font-semibold">{money(total)}</span>
        </div>
      </aside>
    </div>
  );
}
