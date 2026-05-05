"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/lib/cart-context";
import { money } from "@/lib/format";

export function CartView() {
  const { items, total, increment, decrement, remove } = useCart();

  if (items.length === 0) {
    return (
      <section className="grid min-h-[50vh] place-items-center rounded-lg border border-black/10 bg-white p-6 text-center shadow-soft">
        <div className="max-w-sm space-y-4">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-honey/25 text-ink">
            <ShoppingBag size={24} aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold">Корзина пуста</h1>
          <Link href="/" className="inline-flex h-11 items-center rounded-lg bg-ink px-5 text-sm font-semibold text-white">
            Перейти в каталог
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Корзина</h1>
        {items.map((item) => (
          <article key={item.productId} className="grid grid-cols-[88px_1fr] gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-soft">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-black/5">
              {item.image ? <Image src={item.image} alt={item.name} fill sizes="88px" className="object-cover" /> : null}
            </div>
            <div className="min-w-0 space-y-3">
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 font-semibold leading-snug">{item.name}</h2>
                  <p className="text-sm font-semibold text-coral">{money(item.price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink/55 hover:bg-black/5"
                  title="Удалить"
                >
                  <Trash2 size={17} aria-hidden />
                </button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 items-center rounded-lg border border-black/10 bg-paper">
                  <button type="button" onClick={() => decrement(item.productId)} className="grid h-10 w-10 place-items-center" title="Меньше">
                    <Minus size={16} aria-hidden />
                  </button>
                  <span className="grid h-10 w-9 place-items-center text-sm font-semibold">{item.quantity}</span>
                  <button type="button" onClick={() => increment(item.productId)} className="grid h-10 w-10 place-items-center" title="Больше">
                    <Plus size={16} aria-hidden />
                  </button>
                </div>
                <p className="font-semibold">{money(Number(item.price) * item.quantity)}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <aside className="h-fit rounded-lg border border-black/10 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <span className="font-medium">Итого</span>
          <span className="text-xl font-semibold">{money(total)}</span>
        </div>
        <Link href="/checkout" className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-ink px-4 font-semibold text-white">
          Оформить заказ
        </Link>
      </aside>
    </div>
  );
}
