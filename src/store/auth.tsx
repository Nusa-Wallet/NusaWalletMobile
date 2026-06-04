import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

import { TOKEN_KEY } from "@/api/client";
import { AuthApi } from "@/api/endpoints";

type AuthState = {
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then((t) => {
      setToken(t);
      setLoading(false);
    });
  }, []);

  async function persist(t: string) {
    await AsyncStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    router.replace("/(tabs)");
  }

  async function login(email: string, password: string) {
    const { data } = await AuthApi.login(email, password);
    await persist(data.access_token);
  }

  async function register(email: string, name: string, password: string) {
    const { data } = await AuthApi.register(email, name, password);
    await persist(data.access_token);
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    router.replace("/onboarding");
  }

  return (
    <AuthContext.Provider value={{ token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
