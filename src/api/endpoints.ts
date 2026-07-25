import { api } from "./client";

export type WalletBalance = { currency: string; balance: string };
export type LedgerEntry = {
  id: number;
  currency: string;
  direction: "DEBIT" | "CREDIT";
  amount: string;
  ref_type: string;
  description: string | null;
  created_at: string;
};

export type FxAction =
  | "CONVERT_NOW"
  | "HOLD_TEMPORARILY"
  | "SPLIT_CONVERSION"
  | "WAIT"
  | "HOLD";

export type RiskPreference = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";

export type FxAdvisory = {
  pair: string;
  action: FxAction;
  confidence: number;
  current_rate: number;
  ma_7d: number | null;
  volatility_7d: number | null;
  z_score?: number | null;
  // Populated by the Phase 12 decision engine (null on the legacy fallback).
  forecast_rate: number | null;
  forecast_lower: number | null;
  forecast_upper: number | null;
  recommended_convert_percentage: number | null;
  estimated_gain_loss: number | null;
  scenario_best: number;
  scenario_worst: number;
  rationale: string;
  reasons?: string[];
  model_version?: string;
};

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type FraudResult = {
  status?: string;
  risk_score?: number;
  risk_level?: RiskLevel;
  flagged?: boolean;
  recommended_action?: string;
  factors?: string[];
};

export type LoginCredentials =
  | { email: string; phone?: never; password: string }
  | { email?: never; phone: string; password: string };

export type RegisterCredentials = {
  email: string;
  full_name: string;
  password: string;
  phone: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  role: string;
  full_name: string;
  email: string;
};

export type UserResponse = {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_verified: boolean;
};

export const AuthApi = {
  login: (credentials: LoginCredentials) =>
    api.post<TokenResponse>("/auth/login", credentials),
  register: (credentials: RegisterCredentials) =>
    api.post<TokenResponse>("/auth/register", credentials),
  me: () => api.get<UserResponse>("/auth/me"),
  updateProfile: (data: { full_name?: string; phone?: string }) =>
    api.put<UserResponse>("/auth/me", data),
};

export type RateHistoryPoint = { date: string; rate: number };
export type RateHistory = {
  currency: string;
  base: string;
  data: RateHistoryPoint[];
};

export const WalletApi = {
  rates: () => api.get<Record<string, number>>("/wallets/rates"),
  list: () => api.get<WalletBalance[]>("/wallets"),
  history: (ccy: string) => api.get<LedgerEntry[]>(`/wallets/${ccy}/history`),
  rateHistory: (currency = "USD") =>
    api.get<RateHistory>(`/wallets/rates/history`, { params: { currency } }),
  recentTransactions: (limit = 10) =>
    api.get<LedgerEntry[]>(`/wallets/transactions/recent?limit=${limit}`),
  // convert_percentage carries the AI split recommendation (100 = convert all now).
  convert: (
    from_currency: string,
    to_currency: string,
    amount: number,
    convert_percentage = 100,
  ) =>
    api.post("/settlement/convert", {
      from_currency,
      to_currency,
      amount,
      convert_percentage,
    }),
};

export const PaymentApi = {
  create: (currency: string, amount: number, note?: string) =>
    api.post("/payment-links", { currency, amount, note }),
  // Sandbox: simulate an international payer paying the link (drives fraud scoring).
  pay: (code: string, payer_name: string, origin_country?: string) =>
    api.post<FraudResult & { status: string; credited?: string }>(
      `/payment-links/${code}/pay`,
      { payer_name, origin_country },
    ),
};

export type FraudFactor = {
  key: string;
  label: string;
};

export type FraudRecommendation = {
  title: string;
  desc: string;
  bg: string;
  iconColor: string;
};

export type FraudAnalysis = {
  has_data: boolean;
  message?: string;
  risk_score?: number;
  risk_level?: RiskLevel;
  flagged?: boolean;
  recommended_action?: string;
  factors?: FraudFactor[];
  transaction?: {
    id: number;
    amount: string;
    currency: string;
    direction: string;
    description: string;
    created_at: string;
  };
  normal_activity?: {
    avg_amount: number;
    avg_amount_display: string;
    top_currency: string;
    currencies: string[];
    active_hours: string;
    total_transactions: number;
  };
  suspicious_activity?: {
    amount: string;
    currency: string;
    time: string;
    is_unusual_amount: boolean;
    is_odd_hour: boolean;
    is_unusual_currency: boolean;
  };
  recommendations?: FraudRecommendation[];
};

export type DeviceInfo = {
  id: number;
  name: string;
  os: string;
  last_active: string;
  is_current: boolean;
};

export type NotificationPrefItem = {
  key: string;
  push: boolean;
  email: boolean;
};

export const ProfileApi = {
  devices: () => api.get<DeviceInfo[]>("/profile/devices"),
  removeDevice: (id: number) => api.delete(`/profile/devices/${id}`),
  notificationPrefs: () => api.get<NotificationPrefItem[]>("/profile/notifications"),
  updateNotificationPref: (key: string, data: { push?: boolean; email?: boolean }) =>
    api.put<NotificationPrefItem>(`/profile/notifications/${key}`, data),
};

export const InsightsApi = {
  fxAdvisory: (
    base = "SGD",
    quote = "IDR",
    opts?: { amount?: number; horizon_days?: number; risk_preference?: RiskPreference },
  ) => api.get<FxAdvisory>("/insights/fx-advisory", { params: { base, quote, ...opts } }),
};

export const FraudApi = {
  analyze: () => api.get<FraudAnalysis>("/insights/fraud-analysis"),
};
