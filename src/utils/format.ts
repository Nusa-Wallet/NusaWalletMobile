export function formatMoney(amount: number, currency: string, compact = false) {
  const rounded = currency === "IDR" ? Math.round(amount) : Math.round(amount * 100) / 100;
  return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(rounded);
}

export function formatRate(rate: number) {
  if (rate >= 1) return Math.round(rate).toLocaleString("id-ID");
  return rate.toLocaleString("id-ID", { maximumSignificantDigits: 5 });
}

export function tidyDescription(description?: string | null) {
  if (!description) return "Transaksi";
  return description
    .replace(/ @ .*/, "")
    .replace(/\s*\(fee .*?\)/i, "")
    .trim();
}
