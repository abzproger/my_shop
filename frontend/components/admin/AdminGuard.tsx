"use client";

import { ShieldCheck } from "lucide-react";

import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { useAuth } from "@/lib/auth-context";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { initialized, user } = useAuth();

  if (!initialized) {
    return <div className="h-48 animate-pulse rounded-lg bg-black/10" />;
  }

  if (!user) {
    return (
      <section className="space-y-4 rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-moss/15 text-moss">
            <ShieldCheck size={21} aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold">Админка</h1>
        </div>
        <TelegramLoginButton />
      </section>
    );
  }

  if (!user.is_admin) {
    return (
      <section className="rounded-lg border border-coral/30 bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold">Нет доступа</h1>
        <p className="mt-2 text-ink/65">Ваш Telegram ID не указан в ADMIN_TELEGRAM_IDS.</p>
      </section>
    );
  }

  return <>{children}</>;
}
