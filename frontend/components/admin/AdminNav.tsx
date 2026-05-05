import { Boxes, ClipboardList } from "lucide-react";
import Link from "next/link";

export function AdminNav() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link href="/admin/products" className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-soft transition hover:-translate-y-0.5">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-honey/25 text-ink">
          <Boxes size={22} aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold">Товары</h2>
          <p className="text-sm text-ink/60">Каталог</p>
        </div>
      </Link>
      <Link href="/admin/orders" className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-soft transition hover:-translate-y-0.5">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-moss/15 text-moss">
          <ClipboardList size={22} aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold">Заказы</h2>
          <p className="text-sm text-ink/60">Операции</p>
        </div>
      </Link>
    </div>
  );
}
