"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import type { TelegramLoginPayload, User } from "@/types/shop";

const TOKEN_STORAGE_KEY = "my_shop_access_token";

type AuthContextValue = {
  initialized: boolean;
  token: string | null;
  user: User | null;
  loginWithTelegramWidget: (payload: TelegramLoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const applyAuth = useCallback((nextToken: string, nextUser: User) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const loginWithTelegramWidget = useCallback(
    async (payload: TelegramLoginPayload) => {
      const response = await api.loginAuth(payload);
      applyAuth(response.access_token, response.user);
    },
    [applyAuth]
  );

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
          const currentUser = await api.me(storedToken);
          if (mounted) {
            setToken(storedToken);
            setUser(currentUser);
          }
        }
      } catch {
        if (mounted) logout();
      } finally {
        if (mounted) setInitialized(true);
      }
    }

    void initialize();
    return () => {
      mounted = false;
    };
  }, [logout]);

  const value = useMemo(
    () => ({ initialized, token, user, loginWithTelegramWidget, logout }),
    [initialized, token, user, loginWithTelegramWidget, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
