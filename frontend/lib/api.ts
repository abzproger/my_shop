import type {
  Category,
  Order,
  OrderPreview,
  OrderStatus,
  Product,
  TelegramLoginPayload,
  TokenResponse,
  User
} from "@/types/shop";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export function formatApiErrorDetail(detail: unknown): string {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((entry) => {
        if (entry && typeof entry === "object" && "msg" in entry) {
          return String((entry as { msg: unknown }).msg);
        }
        return "";
      })
      .filter(Boolean);
    return parts.length ? parts.join(" ") : "";
  }
  if (typeof detail === "object" && detail !== null && "message" in detail) {
    return String((detail as { message: unknown }).message);
  }
  return "";
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public rawDetail?: unknown
  ) {
    super(message);
  }
}

type ApiOptions = RequestInit & {
  token?: string | null;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const rawDetail = body?.detail;
    const detailText = formatApiErrorDetail(rawDetail);
    const message =
      detailText ||
      (response.status === 404 ? "Не найдено" : "") ||
      (response.status >= 500 ? "Ошибка сервера. Попробуйте позже." : "") ||
      "Не удалось выполнить запрос";
    throw new ApiError(response.status, message, rawDetail);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  categories: () => apiFetch<Category[]>("/categories"),
  products: (params?: { categoryId?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.categoryId) query.set("category_id", String(params.categoryId));
    if (params?.search) query.set("search", params.search);
    const suffix = query.toString() ? `?${query}` : "";
    return apiFetch<Product[]>(`/products${suffix}`);
  },
  product: (id: number) => apiFetch<Product>(`/products/${id}`),
  miniAuth: (initData: string) =>
    apiFetch<TokenResponse>("/auth/telegram-mini-app", {
      method: "POST",
      body: JSON.stringify({ init_data: initData })
    }),
  loginAuth: (payload: TelegramLoginPayload) =>
    apiFetch<TokenResponse>("/auth/telegram-login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  me: (token: string) => apiFetch<User>("/auth/me", { token }),
  previewOrder: (items: Array<{ product_id: number; quantity: number }>) =>
    apiFetch<OrderPreview>("/orders/preview", {
      method: "POST",
      body: JSON.stringify({ items })
    }),
  createOrder: (
    token: string,
    payload: {
      items: Array<{ product_id: number; quantity: number }>;
      phone: string;
      address: string;
      payment_method: "CASH" | "TRANSFER";
    }
  ) =>
    apiFetch<Order>("/orders", {
      method: "POST",
      token,
      body: JSON.stringify(payload)
    }),
  orders: (token: string) => apiFetch<Order[]>("/orders", { token }),
  order: (token: string, id: number) => apiFetch<Order>(`/orders/${id}`, { token }),
  cancelOrder: (token: string, id: number) =>
    apiFetch<Order>(`/orders/${id}/cancel`, { method: "POST", token }),
  adminProducts: (token: string) => apiFetch<Product[]>("/admin/products", { token }),
  adminCategories: (token: string) => apiFetch<Category[]>("/admin/categories", { token }),
  adminCreateProduct: (token: string, payload: unknown) =>
    apiFetch<Product>("/admin/products", { method: "POST", token, body: JSON.stringify(payload) }),
  adminUpdateProduct: (token: string, id: number, payload: unknown) =>
    apiFetch<Product>(`/admin/products/${id}`, { method: "PATCH", token, body: JSON.stringify(payload) }),
  adminDeleteProduct: (token: string, id: number) =>
    apiFetch<void>(`/admin/products/${id}`, { method: "DELETE", token }),
  adminCreateCategory: (token: string, payload: { name: string }) =>
    apiFetch<Category>("/admin/categories", { method: "POST", token, body: JSON.stringify(payload) }),
  adminUpdateCategory: (token: string, id: number, payload: { name: string }) =>
    apiFetch<Category>(`/admin/categories/${id}`, { method: "PATCH", token, body: JSON.stringify(payload) }),
  adminDeleteCategory: (token: string, id: number) =>
    apiFetch<void>(`/admin/categories/${id}`, { method: "DELETE", token }),
  adminUploadImage: (token: string, file: File) => {
    const body = new FormData();
    body.append("image", file);
    return apiFetch<{ url: string }>("/admin/uploads/image", { method: "POST", token, body });
  },
  adminOrders: (token: string, status?: OrderStatus | "ALL") => {
    const suffix = status && status !== "ALL" ? `?status=${status}` : "";
    return apiFetch<Order[]>(`/admin/orders${suffix}`, { token });
  },
  adminUpdateOrderStatus: (token: string, id: number, status: OrderStatus) =>
    apiFetch<Order>(`/admin/orders/${id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status })
    })
};
