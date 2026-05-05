"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import { api } from "@/lib/api";
import type { Category, Product } from "@/types/shop";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductSkeleton } from "@/components/catalog/ProductSkeleton";

export function ProductGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setError("Не удалось загрузить категории"));
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      api
        .products({ categoryId, search: search.trim().length >= 2 ? search.trim() : undefined })
        .then(setProducts)
        .catch(() => setError("Не удалось загрузить каталог"))
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [categoryId, search]);

  const skeletons = useMemo(() => Array.from({ length: 6 }), []);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-soft md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">Каталог</h1>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/45" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск товаров"
              className="h-12 w-full rounded-lg border border-black/10 bg-paper pl-10 pr-10 text-base outline-none transition focus:border-moss"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink/60 hover:bg-black/5"
                title="Очистить"
              >
                <X size={16} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:max-w-xl">
          <button
            type="button"
            onClick={() => setCategoryId(undefined)}
            className={clsx(
              "h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition",
              categoryId === undefined ? "bg-ink text-white" : "bg-paper text-ink hover:bg-black/5"
            )}
          >
            Все
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setCategoryId(category.id)}
              className={clsx(
                "h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition",
                categoryId === category.id ? "bg-ink text-white" : "bg-paper text-ink hover:bg-black/5"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {error ? <div className="rounded-lg border border-coral/30 bg-coral/10 p-3 text-sm text-coral">{error}</div> : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? skeletons.map((_, index) => <ProductSkeleton key={index} />)
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </section>

      {!loading && products.length === 0 ? (
        <div className="rounded-lg border border-black/10 bg-white p-6 text-center text-ink/60">Товаров не найдено</div>
      ) : null}
    </div>
  );
}
