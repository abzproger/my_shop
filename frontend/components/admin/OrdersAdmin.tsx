"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { money, paymentLabel, statusLabel } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/shop";

const statuses: Array<OrderStatus | "ALL"> = ["ALL", "NEW", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export function OrdersAdmin() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setOrders(await api.adminOrders(token, status));
    } catch {
      setError("Не удалось загрузить заказы");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token, status]);

  async function updateStatus(orderId: number, nextStatus: OrderStatus) {
    if (!token) return;
    setUpdatingId(orderId);
    try {
      await api.adminUpdateOrderStatus(token, orderId, nextStatus);
      await load();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AdminGuard>
      <div className="space-y-4">
        <section className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">Заказы</h1>
          <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | "ALL")} className="h-11 rounded-lg border border-black/10 bg-paper px-3 outline-none focus:border-moss">
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "Все статусы" : statusLabel(item)}
              </option>
            ))}
          </select>
        </section>

        {error ? <p className="rounded-lg bg-coral/10 p-3 text-sm text-coral">{error}</p> : null}
        {loading ? <div className="h-56 animate-pulse rounded-lg bg-black/10" /> : null}

        {!loading && orders.map((order) => (
          <article key={order.id} className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Заказ #{order.id}</h2>
                <p className="text-sm text-ink/60">{new Date(order.created_at).toLocaleString("ru-RU")}</p>
                <p className="mt-2 font-semibold text-coral">{money(order.total_price)}</p>
              </div>
              <div className="flex items-center gap-2">
                {updatingId === order.id ? <Loader2 size={17} className="animate-spin text-moss" aria-hidden /> : null}
                <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)} className="h-10 rounded-lg border border-black/10 bg-paper px-3 text-sm outline-none focus:border-moss">
                  {statuses.filter((item) => item !== "ALL").map((item) => (
                    <option key={item} value={item}>
                      {statusLabel(item)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-2 border-t border-black/10 pt-4 text-sm sm:grid-cols-2">
              <p><span className="text-ink/55">Телефон:</span> {order.phone}</p>
              <p><span className="text-ink/55">Оплата:</span> {paymentLabel(order.payment_method)}</p>
              <p className="sm:col-span-2"><span className="text-ink/55">Адрес:</span> {order.address}</p>
            </div>
            <div className="mt-4 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 rounded-lg bg-paper px-3 py-2 text-sm">
                  <span className="line-clamp-2">{item.product_name} x {item.quantity}</span>
                  <span className="shrink-0 font-semibold">{money(Number(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
          </article>
        ))}

        {!loading && orders.length === 0 ? (
          <div className="rounded-lg border border-black/10 bg-white p-6 text-center text-ink/60">Заказов нет</div>
        ) : null}
      </div>
    </AdminGuard>
  );
}
