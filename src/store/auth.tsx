import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

import { TOKEN_KEY } from "@/api/client";
import { AuthApi, LoginCredentials } from "@/api/endpoints";

export type LoginMethod = "email" | "phone";

export const ONBOARDING_COMPLETE_KEY = "nusawallet.onboarding-complete";

type AuthState = {
  token: string | null;
  hasOnboarded: boolean;
  loading: boolean;
  login: (identifier: string, password: string, method?: LoginMethod) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function hydrateAuth() {
      try {
        const values = await AsyncStorage.multiGet([TOKEN_KEY, ONBOARDING_COMPLETE_KEY]);
        const storedToken = values[0][1];
        const completedOnboarding = values[1][1] === "true" || Boolean(storedToken);

        setToken(storedToken);
        setHasOnboarded(completedOnboarding);

        // Migrate users who logged in before the onboarding flag existed.
        if (storedToken && values[1][1] !== "true") {
          await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
        }
      } finally {
        setLoading(false);
      }
    }

    void hydrateAuth();
  }, []);

  async function persist(t: string) {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, t],
      [ONBOARDING_COMPLETE_KEY, "true"],
    ]);
    setToken(t);
    setHasOnboarded(true);
    router.replace("/(tabs)");
  }

  async function login(identifier: string, password: string, method: LoginMethod = "email") {
    const credentials: LoginCredentials = method === "email"
      ? { email: identifier, password }
      : { phone: identifier, password };
    const { data } = await AuthApi.login(credentials);
    await persist(data.access_token);
  }

  async function register(email: string, name: string, password: string) {
    const { data } = await AuthApi.register(email, name, password);
    await persist(data.access_token);
  }

  async function logout() {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true"),
    ]);
    setToken(null);
    setHasOnboarded(true);
    router.replace("/(auth)/login");
  }

  return (
    <AuthContext.Provider value={{ token, hasOnboarded, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
