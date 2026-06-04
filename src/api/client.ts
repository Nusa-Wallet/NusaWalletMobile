import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

// Android emulator can't reach the host via "localhost" — use 10.0.2.2.
// For a physical device, set EXPO_PUBLIC_API_URL to your machine's LAN IP.
const DEFAULT_HOST = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_HOST;

export const TOKEN_KEY = "nusawallet.token";

export const api = axios.create({ baseURL: API_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
