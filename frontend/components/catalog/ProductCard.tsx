"use client";

import { Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { money } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/types/shop";

export function ProductCard({ product }: { product: Product }) {
  const { addProduct, items } = useCart();
  const router = useRouter();
  const image = product.images[0];
  const inCart = items.some((item) => item.productId === product.id);

  const handleCartClick = () => {
    if (inCart) {
      router.push("/cart");
      return;
    }
    addProduct(product);
  };

  return (
    <article className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-soft">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/3] bg-black/5">
          {image ? (
            <Image src={image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-ink/50">Нет фото</div>
          )}
        </div>
      </Link>
      <div className="space-y-3 p-3">
        <div className="min-h-[72px] space-y-1">
          <p className="text-xs font-medium uppercase tracking-normal text-moss">{product.category_name}</p>
          <Link href={`/products/${product.id}`} className="line-clamp-2 font-semibold leading-snug">
            {product.name}
          </Link>
          <p className="font-semibold text-coral">{money(product.price)}</p>
        </div>
        <button
          type="button"
          onClick={handleCartClick}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-white transition ${
            inCart ? "bg-moss hover:bg-moss/90" : "bg-ink hover:bg-black"
          }`}
        >
          <Plus size={17} aria-hidden />
          <ShoppingCart size={17} aria-hidden />
          <span>{inCart ? "Уже в корзине" : "В корзину"}</span>
        </button>
      </div>
    </article>
  );
}
