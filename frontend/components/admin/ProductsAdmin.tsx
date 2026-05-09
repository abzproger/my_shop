"use client";

import { Loader2, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import clsx from "clsx";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { money } from "@/lib/format";
import type { Category, Product } from "@/types/shop";

type ProductForm = {
  id?: number;
  name: string;
  description: string;
  price: string;
  category_id: string;
  images: string;
  is_active: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  images: "",
  is_active: true
};

function urlsFromInput(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProductsAdmin() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [nextProducts, nextCategories] = await Promise.all([api.adminProducts(token), api.adminCategories(token)]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setForm((current) => (current.category_id ? current : { ...current, category_id: String(nextCategories[0]?.id ?? "") }));
    } catch {
      setError("Не удалось загрузить админ-данные");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  function edit(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: String(product.price),
      category_id: String(product.category_id),
      images: product.images.join("\n"),
      is_active: product.is_active
    });
  }

  function reset() {
    setForm({ ...emptyForm, category_id: String(categories[0]?.id ?? "") });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category_id: Number(form.category_id),
      images: urlsFromInput(form.images),
      is_active: form.is_active
    };

    try {
      if (form.id) {
        await api.adminUpdateProduct(token, form.id, payload);
      } else {
        await api.adminCreateProduct(token, payload);
      }
      reset();
      await load();
    } catch {
      setError("Не удалось сохранить товар");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    if (!token || !event.target.files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(Array.from(event.target.files).map((file) => api.adminUploadImage(token, file)));
      const uploadedUrls = uploaded.map((item) => item.url);
      setForm((current) => {
        const existing = urlsFromInput(current.images);
        return { ...current, images: [...existing, ...uploadedUrls].join("\n") };
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить изображения");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function deleteProduct(productId: number) {
    if (!token) return;
    await api.adminDeleteProduct(token, productId);
    await load();
  }

  return (
    <AdminGuard>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="h-fit space-y-4 rounded-lg border border-black/10 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{form.id ? "Редактирование" : "Новый товар"}</h1>
            <button type="button" onClick={reset} className="grid h-10 w-10 place-items-center rounded-lg text-ink/60 hover:bg-black/5" title="Сбросить">
              <RotateCcw size={17} aria-hidden />
            </button>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Название</span>
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-11 w-full rounded-lg border border-black/10 bg-paper px-3 outline-none focus:border-moss" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Описание</span>
            <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className="w-full resize-none rounded-lg border border-black/10 bg-paper px-3 py-3 outline-none focus:border-moss" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Цена</span>
              <input required type="number" min="1" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="h-11 w-full rounded-lg border border-black/10 bg-paper px-3 outline-none focus:border-moss" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Категория</span>
              <select required value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })} className="h-11 w-full rounded-lg border border-black/10 bg-paper px-3 outline-none focus:border-moss">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Изображения</span>
            <textarea value={form.images} onChange={(event) => setForm({ ...form, images: event.target.value })} rows={3} placeholder="Можно вставить URL-адреса, по одному на строку" className="w-full resize-none rounded-lg border border-black/10 bg-paper px-3 py-3 outline-none focus:border-moss" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Загрузка файлов</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-moss/15 file:px-3 file:py-2 file:font-medium file:text-moss hover:file:bg-moss/20"
            />
            <p className="text-xs text-ink/60">Файлы будут загружены на сервер и автоматически добавлены в список изображений.</p>
            {uploading ? <p className="text-xs text-moss">Загружаю изображения...</p> : null}
          </label>
          <label className="flex items-center gap-3 rounded-lg bg-paper p-3 text-sm font-medium">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="h-4 w-4 accent-moss" />
            Активен
          </label>
          {error ? <p className="rounded-lg bg-coral/10 p-3 text-sm text-coral">{error}</p> : null}
          <button type="submit" disabled={saving} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 font-semibold text-white disabled:opacity-60">
            {saving ? <Loader2 size={17} className="animate-spin" aria-hidden /> : form.id ? <Save size={17} aria-hidden /> : <Plus size={17} aria-hidden />}
            Сохранить
          </button>
        </form>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Товары</h2>
          {loading ? <div className="h-48 animate-pulse rounded-lg bg-black/10" /> : null}
          {!loading && products.map((product) => (
            <article key={product.id} className={clsx("rounded-lg border border-black/10 bg-white p-4 shadow-soft", !product.is_active && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-ink/60">{product.category_name}</p>
                  <p className="mt-1 font-semibold text-coral">{money(product.price)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => edit(product)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-black/5" title="Редактировать">
                    <Pencil size={17} aria-hidden />
                  </button>
                  <button type="button" onClick={() => deleteProduct(product.id)} className="grid h-10 w-10 place-items-center rounded-lg text-coral hover:bg-coral/10" title="Удалить">
                    <Trash2 size={17} aria-hidden />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AdminGuard>
  );
}
