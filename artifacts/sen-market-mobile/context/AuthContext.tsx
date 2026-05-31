import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  avatarUrl?: string | null;
  isAdmin: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erreur réseau" }));
    throw new Error(err.error || err.message || "Erreur inconnue");
  }
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("auth_token");
        if (stored) {
          setToken(stored);
          const me = await apiFetch("/api/auth/me");
          setUser(me);
        }
      } catch {
        await AsyncStorage.removeItem("auth_token");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const userToken = data.token || data.sessionId || "session";
    await AsyncStorage.setItem("auth_token", userToken);
    setToken(userToken);
    setUser(data.user);
    queryClient.invalidateQueries();
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
    });
    const userToken = data.token || data.sessionId || "session";
    await AsyncStorage.setItem("auth_token", userToken);
    setToken(userToken);
    setUser(data.user);
    queryClient.invalidateQueries();
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {}
    await AsyncStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
