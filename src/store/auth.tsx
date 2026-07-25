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
const SECURE_ROLE_KEY = "nusawallet.user-role";
export const ONBOARDING_COMPLETE_KEY = "nusawallet.onboarding-complete";
export const SPLASH_COMPLETE_KEY = "nusawallet.splash-complete";

type AuthState = {
  token: string | null;
  hasOnboarded: boolean;
  loading: boolean;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
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
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function hydrateAuth() {
      try {
        const storedToken = await hydrateToken();
        const [[_, onboardedStr], storedName, storedEmail, storedRole] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY).then((v) => ["k", v ?? ""] as const),
          secureGet(SECURE_NAME_KEY),
          secureGet(SECURE_EMAIL_KEY),
          secureGet(SECURE_ROLE_KEY),
        ]);
        const completedOnboarding = onboardedStr === "true" || Boolean(storedToken);

        setToken(storedToken);
        setHasOnboarded(completedOnboarding);
        setUserName(storedName);
        setUserEmail(storedEmail);
        setUserRole(storedRole);

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

  async function persist(t: string, name: string, email: string, role: string) {
    setAuthToken(t);
    setToken(t);
    setHasOnboarded(true);
    setUserName(name);
    setUserEmail(email);
    setUserRole(role);
    await Promise.all([
      secureSet(SECURE_TOKEN_KEY, t),
      secureSet(SECURE_NAME_KEY, name),
      secureSet(SECURE_EMAIL_KEY, email),
      secureSet(SECURE_ROLE_KEY, role),
      AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true"),
    ]);
    router.replace("/(tabs)");
  }

  async function login(identifier: string, password: string, method: LoginMethod = "email") {
    const credentials: LoginCredentials = method === "email"
      ? { email: identifier, password }
      : { phone: identifier, password };
    const { data } = await AuthApi.login(credentials);
    await persist(data.access_token, data.full_name, data.email, data.role);
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
      secureDelete(SECURE_ROLE_KEY),
      AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true"),
    ]);
    setToken(null);
    setHasOnboarded(true);
    setUserName(null);
    setUserEmail(null);
    setUserRole(null);
    router.replace("/(auth)/login");
  }

  return (
    <AuthContext.Provider
      value={{ token, hasOnboarded, loading, userName, userEmail, userRole, login, register, logout }}
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
