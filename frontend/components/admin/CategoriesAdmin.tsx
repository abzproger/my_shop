"use client";

import { Loader2, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Category } from "@/types/shop";

type CategoryForm = {
  id?: number;
  name: string;
};

const emptyForm: CategoryForm = { name: "" };

export function CategoriesAdmin() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setCategories(await api.adminCategories(token));
    } catch {
      setError("Не удалось загрузить категории");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  function reset() {
    setForm(emptyForm);
  }

  function edit(category: Category) {
    setForm({ id: category.id, name: category.name });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { name: form.name.trim() };
      if (form.id) {
        await api.adminUpdateCategory(token, form.id, payload);
      } else {
        await api.adminCreateCategory(token, payload);
      }
      reset();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось сохранить категорию");
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(categoryId: number) {
    if (!token) return;
    setError(null);
    try {
      await api.adminDeleteCategory(token, categoryId);
      if (form.id === categoryId) reset();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось удалить категорию");
    }
  }

  return (
    <AdminGuard>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="h-fit space-y-4 rounded-lg border border-black/10 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{form.id ? "Редактирование" : "Новая категория"}</h1>
            <button type="button" onClick={reset} className="grid h-10 w-10 place-items-center rounded-lg text-ink/60 hover:bg-black/5" title="Сбросить">
              <RotateCcw size={17} aria-hidden />
            </button>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Название</span>
            <input
              required
              minLength={2}
              maxLength={255}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="h-11 w-full rounded-lg border border-black/10 bg-paper px-3 outline-none focus:border-moss"
              placeholder="Например: Напитки"
            />
          </label>
          {error ? <p className="rounded-lg bg-coral/10 p-3 text-sm text-coral">{error}</p> : null}
          <button type="submit" disabled={saving} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 font-semibold text-white disabled:opacity-60">
            {saving ? <Loader2 size={17} className="animate-spin" aria-hidden /> : form.id ? <Save size={17} aria-hidden /> : <Plus size={17} aria-hidden />}
            Сохранить
          </button>
        </form>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Категории</h2>
          {loading ? <div className="h-40 animate-pulse rounded-lg bg-black/10" /> : null}
          {!loading &&
            categories.map((category) => (
              <article key={category.id} className="flex items-center justify-between rounded-lg border border-black/10 bg-white p-4 shadow-soft">
                <h3 className="font-semibold">{category.name}</h3>
                <div className="flex gap-1">
                  <button type="button" onClick={() => edit(category)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-black/5" title="Редактировать">
                    <Pencil size={17} aria-hidden />
                  </button>
                  <button type="button" onClick={() => removeCategory(category.id)} className="grid h-10 w-10 place-items-center rounded-lg text-coral hover:bg-coral/10" title="Удалить">
                    <Trash2 size={17} aria-hidden />
                  </button>
                </div>
              </article>
            ))}
        </section>
      </div>
    </AdminGuard>
  );
}
