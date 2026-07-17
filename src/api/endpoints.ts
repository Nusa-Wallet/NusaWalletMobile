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

export const AuthApi = {
  login: (credentials: LoginCredentials) =>
    api.post<{ access_token: string }>("/auth/login", credentials),
  register: (credentials: RegisterCredentials) =>
    api.post<{ access_token: string }>("/auth/register", credentials),
  me: () => api.get("/auth/me"),
};

export const WalletApi = {
  rates: () => api.get<Record<string, number>>("/wallets/rates"),
  list: () => api.get<WalletBalance[]>("/wallets"),
  history: (ccy: string) => api.get<LedgerEntry[]>(`/wallets/${ccy}/history`),
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

export const InsightsApi = {
  fxAdvisory: (
    base = "SGD",
    quote = "IDR",
    opts?: { amount?: number; horizon_days?: number; risk_preference?: RiskPreference },
  ) => api.get<FxAdvisory>("/insights/fx-advisory", { params: { base, quote, ...opts } }),
};
