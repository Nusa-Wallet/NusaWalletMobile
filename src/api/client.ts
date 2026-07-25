import axios from "axios";
import { Platform } from "react-native";

const DEFAULT_HOST = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_HOST;

export const api = axios.create({ baseURL: API_URL, timeout: 10000 });

let _token: string | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

export function getAuthToken(): string | null {
  return _token;
}

export function onUnauthorized(handler: () => void) {
  _onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && _onUnauthorized) {
      _onUnauthorized();
    }
    return Promise.reject(err);
  },
);
