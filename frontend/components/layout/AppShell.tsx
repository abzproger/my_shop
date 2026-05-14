"use client";

import { ClipboardList, Package, ShieldCheck, ShoppingBag, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import logo from "@/logo.jpg";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

const navItems = [
  { href: "/", label: "Каталог", icon: Package },
  { href: "/cart", label: "Корзина", icon: ShoppingBag },
  { href: "/admin", label: "Админка", icon: ShieldCheck }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { count } = useCart();
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    if (window.confirm("Выйти из аккаунта?")) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
            <span className="relative h-9 w-9 overflow-hidden rounded-lg border border-black/10 bg-white">
              <Image src={logo} alt="" fill sizes="36px" className="object-cover" priority />
            </span>
            <span className="truncate">MebelHub</span>
          </Link>

          <nav className="ml-auto flex items-center gap-1">
            {navItems
              .filter((item) => (item.href === "/admin" ? user?.is_admin : true))
              .map((item) => {
              const Icon = item.icon;
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "relative grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm transition",
                    active ? "bg-ink text-white" : "text-ink/70 hover:bg-black/5"
                  )}
                  title={item.label}
                >
                  <Icon size={18} aria-hidden />
                  <span className="sr-only">{item.label}</span>
                  {item.href === "/cart" && count > 0 ? (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-semibold text-white">
                      {count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            {user ? (
              <Link
                href="/orders"
                className={clsx(
                  "grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm transition",
                  pathname.startsWith("/orders") ? "bg-ink text-white" : "text-ink/70 hover:bg-black/5"
                )}
                title="Мои заказы"
              >
                <ClipboardList size={18} aria-hidden />
                <span className="sr-only">Мои заказы</span>
              </Link>
            ) : null}
            {user ? (
              <button
                type="button"
                onClick={confirmLogout}
                className="ml-1 grid h-10 min-w-10 place-items-center rounded-lg text-ink/70 hover:bg-black/5"
                title={user.username ? `@${user.username}` : "Профиль"}
              >
                <UserRound size={18} aria-hidden />
                <span className="sr-only">Выйти</span>
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4 sm:pt-6">
        {children}
      </main>
    </div>
  );
}
