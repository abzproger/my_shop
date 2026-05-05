"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import type { TelegramLoginPayload } from "@/types/shop";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

declare global {
  interface Window {
    onTelegramAuth?: (payload: TelegramLoginPayload) => void;
  }
}

export function TelegramLoginButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { loginWithTelegramWidget } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !BOT_USERNAME) return;

    window.onTelegramAuth = async (payload: TelegramLoginPayload) => {
      try {
        setError(null);
        await loginWithTelegramWidget(payload);
      } catch {
        setError("Не удалось войти через Telegram");
      }
    };

    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    containerRef.current.appendChild(script);
  }, [loginWithTelegramWidget]);

  if (!BOT_USERNAME) {
    return (
      <div className="rounded-lg border border-coral/30 bg-coral/10 p-3 text-sm text-coral">
        NEXT_PUBLIC_TELEGRAM_BOT_USERNAME не настроен.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} />
      {error ? <p className="text-sm text-coral">{error}</p> : null}
    </div>
  );
}
