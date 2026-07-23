import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

import { TOKEN_KEY } from "@/api/client";
import { AuthApi, LoginCredentials, RegisterCredentials } from "@/api/endpoints";

export type LoginMethod = "email" | "phone";

export const ONBOARDING_COMPLETE_KEY = "nusawallet.onboarding-complete";
export const USER_NAME_KEY = "nusawallet.user-name";
export const USER_EMAIL_KEY = "nusawallet.user-email";

type AuthState = {
  token: string | null;
  hasOnboarded: boolean;
  loading: boolean;
  userName: string | null;
  userEmail: string | null;
  login: (identifier: string, password: string, method?: LoginMethod) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function hydrateAuth() {
      try {
        const values = await AsyncStorage.multiGet([
          TOKEN_KEY,
          ONBOARDING_COMPLETE_KEY,
          USER_NAME_KEY,
          USER_EMAIL_KEY,
        ]);
        const storedToken = values[0][1];
        const completedOnboarding = values[1][1] === "true" || Boolean(storedToken);
        const storedName = values[2][1];
        const storedEmail = values[3][1];

        setToken(storedToken);
        setHasOnboarded(completedOnboarding);
        setUserName(storedName);
        setUserEmail(storedEmail);

        if (storedToken && values[1][1] !== "true") {
          await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
        }
      } finally {
        setLoading(false);
      }
    }

    void hydrateAuth();
  }, []);

  async function persist(t: string, name?: string, email?: string) {
    const sets: [string, string][] = [
      [TOKEN_KEY, t],
      [ONBOARDING_COMPLETE_KEY, "true"],
    ];
    if (name) sets.push([USER_NAME_KEY, name]);
    if (email) sets.push([USER_EMAIL_KEY, email]);
    await AsyncStorage.multiSet(sets);
    setToken(t);
    setHasOnboarded(true);
    if (name) setUserName(name);
    if (email) setUserEmail(email);
    router.replace("/(tabs)");
  }

  async function login(identifier: string, password: string, method: LoginMethod = "email") {
    const credentials: LoginCredentials = method === "email"
      ? { email: identifier, password }
      : { phone: identifier, password };
    const { data } = await AuthApi.login(credentials);
    const name = identifier.split("@")[0].replace(/[^a-zA-Z]/g, " ");
    const displayName = name.replace(/\b\w/g, (c) => c.toUpperCase());
    await persist(data.access_token, displayName, identifier);
  }

  async function register(credentials: RegisterCredentials) {
    await AuthApi.register(credentials);
  }

  async function logout() {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true"),
    ]);
    setToken(null);
    setHasOnboarded(true);
    setUserName(null);
    setUserEmail(null);
    router.replace("/(auth)/login");
  }

  return (
    <AuthContext.Provider
      value={{ token, hasOnboarded, loading, userName, userEmail, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
