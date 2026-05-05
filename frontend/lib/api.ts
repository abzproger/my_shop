import type {
  Category,
  Order,
  OrderStatus,
  Product,
  TelegramLoginPayload,
  TokenResponse,
  User
} from "@/types/shop";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

type ApiOptions = RequestInit & {
  token?: string | null;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
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
    const detail = await response.json().catch(() => null);
    throw new ApiError(response.status, detail?.detail ?? "API request failed");
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
  adminProducts: (token: string) => apiFetch<Product[]>("/admin/products", { token }),
  adminCategories: (token: string) => apiFetch<Category[]>("/admin/categories", { token }),
  adminCreateProduct: (token: string, payload: unknown) =>
    apiFetch<Product>("/admin/products", { method: "POST", token, body: JSON.stringify(payload) }),
  adminUpdateProduct: (token: string, id: number, payload: unknown) =>
    apiFetch<Product>(`/admin/products/${id}`, { method: "PATCH", token, body: JSON.stringify(payload) }),
  adminDeleteProduct: (token: string, id: number) =>
    apiFetch<void>(`/admin/products/${id}`, { method: "DELETE", token }),
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
