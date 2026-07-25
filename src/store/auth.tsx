import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

import { onUnauthorized, setAuthToken } from "@/api/client";
import { AuthApi, LoginCredentials, RegisterCredentials } from "@/api/endpoints";

export type LoginMethod = "email" | "phone";

const SECURE_TOKEN_KEY = "nusawallet.token";
const SECURE_NAME_KEY = "nusawallet.user-name";
const SECURE_EMAIL_KEY = "nusawallet.user-email";
export const ONBOARDING_COMPLETE_KEY = "nusawallet.onboarding-complete";
export const SPLASH_COMPLETE_KEY = "nusawallet.splash-complete";

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

function secureGet(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key).catch(() => null);
}

function secureSet(key: string, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value).catch(() => {});
}

function secureDelete(key: string): Promise<void> {
  return SecureStore.deleteItemAsync(key).catch(() => {});
}

async function hydrateToken() {
  const storedToken = await secureGet(SECURE_TOKEN_KEY);
  if (storedToken) {
    setAuthToken(storedToken);
  }
  return storedToken;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function hydrateAuth() {
      try {
        const storedToken = await hydrateToken();
        const [[_, onboardedStr], storedName, storedEmail] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY).then((v) => ["k", v ?? ""] as const),
          secureGet(SECURE_NAME_KEY),
          secureGet(SECURE_EMAIL_KEY),
        ]);
        const completedOnboarding = onboardedStr === "true" || Boolean(storedToken);

        setToken(storedToken);
        setHasOnboarded(completedOnboarding);
        setUserName(storedName);
        setUserEmail(storedEmail);

        if (storedToken && onboardedStr !== "true") {
          await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
        }
      } finally {
        setLoading(false);
      }
    }

    void hydrateAuth();
  }, []);

  useEffect(() => {
    onUnauthorized(() => {
      setToken(null);
      setAuthToken(null);
      secureDelete(SECURE_TOKEN_KEY);
      router.replace("/(auth)/login");
    });
  }, []);

  async function persist(t: string, name?: string, email?: string) {
    setAuthToken(t);
    await Promise.all([
      secureSet(SECURE_TOKEN_KEY, t),
      AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true"),
      name ? secureSet(SECURE_NAME_KEY, name) : Promise.resolve(),
      email ? secureSet(SECURE_EMAIL_KEY, email) : Promise.resolve(),
    ]);
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
    setAuthToken(null);
    await Promise.all([
      secureDelete(SECURE_TOKEN_KEY),
      secureDelete(SECURE_NAME_KEY),
      secureDelete(SECURE_EMAIL_KEY),
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
