export function money(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function statusLabel(status: string): string {
  return {
    NEW: "Новый",
    CONFIRMED: "Подтвержден",
    SHIPPED: "Отправлен",
    DELIVERED: "Доставлен",
    CANCELLED: "Отменен"
  }[status] ?? status;
}

export function paymentLabel(value: string): string {
  return {
    CASH: "Наличные",
    TRANSFER: "Перевод"
  }[value] ?? value;
}
