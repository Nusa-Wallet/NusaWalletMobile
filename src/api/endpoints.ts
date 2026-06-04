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
export type FxAdvisory = {
  pair: string;
  action: "CONVERT_NOW" | "WAIT" | "HOLD";
  confidence: number;
  current_rate: number;
  ma_7d: number;
  volatility_7d: number;
  rationale: string;
  scenario_best: number;
  scenario_worst: number;
};

export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string }>("/auth/login", { email, password }),
  register: (email: string, full_name: string, password: string) =>
    api.post<{ access_token: string }>("/auth/register", { email, full_name, password }),
  me: () => api.get("/auth/me"),
};

export const WalletApi = {
  rates: () => api.get<Record<string, number>>("/wallets/rates"),
  list: () => api.get<WalletBalance[]>("/wallets"),
  history: (ccy: string) => api.get<LedgerEntry[]>(`/wallets/${ccy}/history`),
  recentTransactions: (limit = 10) =>
    api.get<LedgerEntry[]>(`/wallets/transactions/recent?limit=${limit}`),
  convert: (from_currency: string, to_currency: string, amount: number) =>
    api.post("/settlement/convert", { from_currency, to_currency, amount }),
};

export const PaymentApi = {
  create: (currency: string, amount: number, note?: string) =>
    api.post("/payment-links", { currency, amount, note }),
};

export const InsightsApi = {
  fxAdvisory: (base = "SGD", quote = "IDR") =>
    api.get<FxAdvisory>("/insights/fx-advisory", { params: { base, quote } }),
};
