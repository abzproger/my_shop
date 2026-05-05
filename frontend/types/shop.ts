export type OrderStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "CASH" | "TRANSFER";

export type User = {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  is_admin: boolean;
};

export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: string | number;
  category_id: number;
  category_name: string;
  images: string[];
  is_active: boolean;
};

export type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: string | number;
};

export type Order = {
  id: number;
  status: OrderStatus;
  total_price: string | number;
  phone: string;
  address: string;
  payment_method: PaymentMethod;
  created_at: string;
  items: OrderItem[];
};

export type TelegramLoginPayload = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};
