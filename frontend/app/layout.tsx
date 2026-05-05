import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Shop",
  description: "Каталог физических товаров с Telegram Mini App и веб-доступом"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbfaf7"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
