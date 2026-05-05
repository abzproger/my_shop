"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { Product } from "@/types/shop";

const CART_STORAGE_KEY = "my_shop_cart";

export type CartItem = {
  productId: number;
  name: string;
  price: string | number;
  image: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  addProduct: (product: Product, quantity?: number) => void;
  increment: (productId: number) => void;
  decrement: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function itemTotal(item: CartItem): number {
  return Number(item.price) * item.quantity;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      setItems(JSON.parse(stored));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [hydrated, items]);

  const addProduct = useCallback((product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0] ?? null,
          quantity
        }
      ];
    });
  }, []);

  const increment = useCallback((productId: number) => {
    setItems((current) =>
      current.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item))
    );
  }, []);

  const decrement = useCallback((productId: number) => {
    setItems((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const remove = useCallback((productId: number) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => sum + itemTotal(item), 0),
      addProduct,
      increment,
      decrement,
      remove,
      clear
    }),
    [items, addProduct, increment, decrement, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
