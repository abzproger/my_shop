type TelegramThemeParams = {
  bg_color?: string;
  text_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
};

type TelegramWebApp = {
  initData: string;
  colorScheme?: "light" | "dark";
  themeParams?: TelegramThemeParams;
  ready: () => void;
  expand: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

export function getMiniAppInitData(): string | null {
  const tg = getTelegramWebApp();
  return tg?.initData ? tg.initData : null;
}

export function setupTelegramViewport(): boolean {
  const tg = getTelegramWebApp();
  if (!tg?.initData) return false;

  tg.ready();
  tg.expand();

  const root = document.documentElement;
  root.dataset.telegram = "true";
  root.dataset.theme = tg.colorScheme ?? "light";

  const theme = tg.themeParams ?? {};
  if (theme.bg_color) root.style.setProperty("--tg-bg", theme.bg_color);
  if (theme.text_color) root.style.setProperty("--tg-text", theme.text_color);
  if (theme.button_color) root.style.setProperty("--tg-button", theme.button_color);
  if (theme.button_text_color) root.style.setProperty("--tg-button-text", theme.button_text_color);
  if (theme.secondary_bg_color) root.style.setProperty("--tg-secondary-bg", theme.secondary_bg_color);
  return true;
}
