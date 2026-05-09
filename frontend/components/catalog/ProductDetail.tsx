"use client";

import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { money } from "@/lib/format";
import { resolveImageUrl } from "@/lib/image";
import type { Product } from "@/types/shop";

export function ProductDetail({ productId }: { productId: number }) {
  const { addProduct, items } = useCart();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inCart = items.some((item) => item.productId === productId);
  const mainImage = product?.images[0] ? resolveImageUrl(product.images[0]) : null;

  const handleCartClick = () => {
    if (!product) {
      return;
    }

    if (inCart) {
      router.push("/cart");
      return;
    }

    addProduct(product, quantity);
  };

  useEffect(() => {
    api
      .product(productId)
      .then(setProduct)
      .catch(() => setError("Товар не найден"))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-lg bg-black/10" />
        <div className="space-y-4 rounded-lg bg-white p-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-black/10" />
          <div className="h-5 w-28 animate-pulse rounded bg-black/10" />
          <div className="h-24 animate-pulse rounded bg-black/10" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4 rounded-lg border border-black/10 bg-white p-5">
        <p>{error}</p>
        <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white">
          <ArrowLeft size={17} aria-hidden />
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
      <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
        <div className="relative aspect-square bg-black/5">
          {mainImage ? (
            <Image src={mainImage} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-ink/50">Нет фото</div>
          )}
        </div>
      </div>

      <section className="space-y-5 rounded-lg border border-black/10 bg-white p-4 shadow-soft">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-moss">
          <ArrowLeft size={16} aria-hidden />
          Каталог
        </Link>
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-normal text-moss">{product.category_name}</p>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{product.name}</h1>
          <p className="text-2xl font-semibold text-coral">{money(product.price)}</p>
        </div>
        <p className="leading-7 text-ink/75">{product.description}</p>

        <div className="flex items-center gap-3">
          <div className="flex h-12 items-center rounded-lg border border-black/10 bg-paper">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid h-12 w-12 place-items-center"
              title="Уменьшить"
            >
              <Minus size={17} aria-hidden />
            </button>
            <span className="grid h-12 w-10 place-items-center font-semibold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((value) => value + 1)}
              className="grid h-12 w-12 place-items-center"
              title="Увеличить"
            >
              <Plus size={17} aria-hidden />
            </button>
          </div>
          <button
            type="button"
            onClick={handleCartClick}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg px-4 font-semibold text-white ${
              inCart ? "bg-moss hover:bg-moss/90" : "bg-ink hover:bg-black"
            }`}
          >
            <ShoppingCart size={18} aria-hidden />
            {inCart ? "Уже в корзине" : "В корзину"}
          </button>
        </div>
      </section>
    </div>
  );
}
