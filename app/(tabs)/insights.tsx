import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";

import { FxAdvisory, InsightsApi, RiskPreference, WalletApi } from "@/api/endpoints";
import { colors, radius, spacing } from "@/theme/colors";

// Mock monthly income data (Juta IDR)
const MONTHLY = [
  { label: "Jan", val: 52 },
  { label: "Feb", val: 61 },
  { label: "Mar", val: 58 },
  { label: "Apr", val: 70 },
  { label: "Mei", val: 65 },
  { label: "Jun", val: 75 },
];
const BAR_MAX = 80;

const CCY_USAGE = [
  { label: "USD", pct: 55, color: "#2563EB" },
  { label: "EUR", pct: 20, color: "#7C3AED" },
  { label: "SGD", pct: 18, color: "#16A34A" },
  { label: "MYR", pct: 7, color: "#F97316" },
];

function CurrencyUsageDonut() {
  const size = 140;
  const center = size / 2;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <View
      style={[s.donutWrap, { width: size, height: size }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Komposisi transaksi valas: USD 55 persen, EUR 20 persen, SGD 18 persen, dan MYR 7 persen"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E8EDF5"
          strokeWidth={strokeWidth}
        />
        <G rotation="-90" origin={`${center}, ${center}`}>
          {CCY_USAGE.map((currency) => {
            const segmentLength = (currency.pct / 100) * circumference;
            const offset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += currency.pct;
            // Rounded caps add one stroke width to the visible arc; subtract it
            // so adjacent currencies retain a small, crisp visual gap.
            const visibleLength = Math.max(segmentLength - strokeWidth - 3, 0);
            return (
              <Circle
                key={currency.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={currency.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${visibleLength} ${circumference - visibleLength}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </G>
      </Svg>
      <View style={s.donutCenter}>
        <Text style={s.donutCenterValue}>100%</Text>
        <Text style={s.donutCenterLabel}>transaksi valas</Text>
      </View>
    </View>
  );
}

const ACTION_META: Record<string, { text: string; bg: string }> = {
  CONVERT_NOW: { text: "Konversi Sekarang", bg: colors.primary },
  HOLD_TEMPORARILY: { text: "Tahan Sementara", bg: colors.warning },
  SPLIT_CONVERSION: { text: "Konversi Bertahap", bg: colors.accent },
  WAIT: { text: "Tunggu", bg: colors.warning },
  HOLD: { text: "Tahan", bg: "#64748B" },
};

const RISK_OPTIONS: { key: RiskPreference; label: string }[] = [
  { key: "CONSERVATIVE", label: "Hati-hati" },
  { key: "MODERATE", label: "Moderat" },
  { key: "AGGRESSIVE", label: "Agresif" },
];

const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

export default function Insights() {
  const [adv, setAdv] = useState<FxAdvisory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [risk, setRisk] = useState<RiskPreference>("MODERATE");
  const [usdBalance, setUsdBalance] = useState(1000);
  const [converting, setConverting] = useState(false);

  const fetchAll = useCallback(async (rp: RiskPreference) => {
    let amount = 1000;
    try {
      const { data } = await WalletApi.list();
      amount = Number(data.find((w) => w.currency === "USD")?.balance ?? 0) || 1000;
      setUsdBalance(amount);
    } catch {
      /* keep default amount */
    }
    try {
      const { data } = await InsightsApi.fxAdvisory("USD", "IDR", {
        amount,
        horizon_days: 7,
        risk_preference: rp,
      });
      setAdv(data);
      setError(null);
    } catch {
      setError("Layanan AI tidak tersedia (port 8001).");
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(risk); }, [fetchAll, risk]));

  async function convertSplit() {
    const pct = adv?.recommended_convert_percentage ?? 100;
    if (usdBalance <= 0) {
      Alert.alert("Saldo kosong", "Tidak ada saldo USD untuk dikonversi.");
      return;
    }
    setConverting(true);
    try {
      const { data } = await WalletApi.convert("USD", "IDR", usdBalance, pct);
      Alert.alert(
        "Konversi berhasil",
        `Dikonversi ${data.convert_percentage}% • +${rupiah(Number(data.amount_out))}`,
      );
    } catch {
      Alert.alert("Gagal", "Konversi tidak dapat diproses.");
    } finally {
      setConverting(false);
    }
  }

  const action = adv ? ACTION_META[adv.action] : null;
  const gain = adv?.estimated_gain_loss ?? null;
  const pct = adv?.recommended_convert_percentage ?? null;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.header}>Insights</Text>

        {/* ── Summary cards ── */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Ionicons name="trending-up" size={20} color="#0EA5E9" />
            <Text style={s.summaryLabel}>Pendapatan</Text>
            <Text style={s.summaryVal}>Rp 75M</Text>
          </View>
          <View style={s.summaryCard}>
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <Text style={s.summaryLabel}>Penghematan</Text>
            <Text style={s.summaryVal}>Rp 2.4M</Text>
          </View>
        </View>

        {/* ── Bar chart ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Pendapatan Bulanan (Juta Rp)</Text>
          <View style={s.barChart}>
            {MONTHLY.map((m) => (
              <View key={m.label} style={s.barCol}>
                <View style={s.barTrack}>
                  <View style={[s.bar, { height: `${(m.val / BAR_MAX) * 100}%` }]} />
                </View>
                <Text style={s.barLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Currency donut ── */}
        <View style={s.card}>
          <Text style={[s.cardTitle, { marginBottom: 4 }]}>Penggunaan Mata Uang</Text>
          <Text style={s.chartSubtitle}>
            Proporsi nilai transaksi valas per mata uang (data demo)
          </Text>
          <View style={s.donutRow}>
            <CurrencyUsageDonut />

            <View style={s.donutLegend}>
              {CCY_USAGE.map((c) => (
                <View key={c.label} style={s.legendRow}>
                  <View style={[s.legendDot, { backgroundColor: c.color }]} />
                  <Text style={s.legendLabel}>{c.label}</Text>
                  <Text style={s.legendPct}>{c.pct}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── AI Recommendation ── */}
        {error && (
          <View style={[s.card, { borderColor: "#FEE2E2", borderWidth: 1 }]}>
            <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        {adv && action && (
          <View style={s.card}>
            <View style={s.aiHeader}>
              <View style={s.aiIconWrap}>
                <Ionicons name="globe-outline" size={18} color={colors.accent} />
              </View>
              <Text style={s.aiTitle}>Rekomendasi AI · {adv.pair}</Text>
              <View style={[s.aiBadge, { backgroundColor: action.bg }]}>
                <Text style={s.aiBadgeText}>{action.text}</Text>
              </View>
            </View>

            {/* Risk preference selector */}
            <View style={s.riskRow}>
              {RISK_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.key}
                  onPress={() => setRisk(o.key)}
                  style={[s.riskChip, risk === o.key && s.riskChipActive]}
                >
                  <Text style={[s.riskChipText, risk === o.key && s.riskChipTextActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.aiDesc}>{adv.rationale}</Text>

            {/* Confidence bar */}
            <View style={{ marginTop: spacing.md }}>
              <View style={s.confRow}>
                <Text style={s.confLabel}>Keyakinan Model</Text>
                <Text style={[s.confLabel, { color: colors.accent, fontWeight: "700" }]}>
                  {(adv.confidence * 100).toFixed(0)}%
                </Text>
              </View>
              <View style={s.confTrack}>
                <View style={[s.confFill, { width: `${adv.confidence * 100}%` }]} />
              </View>
            </View>

            {/* Forecast range + split + gain, shown when the decision engine responded */}
            {adv.forecast_lower != null && adv.forecast_upper != null && (
              <View style={s.metricRow}>
                <Ionicons name="analytics-outline" size={15} color={colors.textSecondary} />
                <Text style={s.metricLabel}>Rentang perkiraan (7 hari)</Text>
                <Text style={s.metricVal}>
                  {rupiah(adv.forecast_lower)} – {rupiah(adv.forecast_upper)}
                </Text>
              </View>
            )}
            {gain != null && (
              <View style={s.metricRow}>
                <Ionicons name="cash-outline" size={15} color={colors.textSecondary} />
                <Text style={s.metricLabel}>Estimasi selisih nilai</Text>
                <Text style={[s.metricVal, { color: gain >= 0 ? colors.success : colors.danger }]}>
                  {gain >= 0 ? "+" : "-"}{rupiah(Math.abs(gain))}
                </Text>
              </View>
            )}
            {pct != null && (
              <View style={s.metricRow}>
                <Ionicons name="pie-chart-outline" size={15} color={colors.textSecondary} />
                <Text style={s.metricLabel}>Konversi disarankan sekarang</Text>
                <Text style={[s.metricVal, { color: colors.accent }]}>{pct}%</Text>
              </View>
            )}

            {/* Reasons */}
            {adv.reasons?.slice(0, 3).map((r, i) => (
              <View key={i} style={s.reasonRow}>
                <View style={s.reasonDot} />
                <Text style={s.reasonText}>{r}</Text>
              </View>
            ))}

            {/* Convert the recommended split */}
            {pct != null && usdBalance > 0 && (
              <TouchableOpacity style={s.convertBtn} onPress={convertSplit} disabled={converting}>
                <Ionicons name="swap-horizontal-outline" size={16} color="#fff" />
                <Text style={s.convertBtnText}>
                  {converting ? "Memproses..." : `Konversi ${pct}% USD sekarang`}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={s.disclaimer}>
              Estimasi berbasis data historis & skenario — bukan jaminan keuntungan. Kurs
              dapat berubah sewaktu-waktu.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  header: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },

  summaryRow: { flexDirection: "row", gap: spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  summaryLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  summaryVal: { color: colors.textPrimary, fontWeight: "800", fontSize: 18 },

  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.md },
  chartSubtitle: {
    color: colors.textSecondary, fontSize: 12, lineHeight: 18,
    marginBottom: spacing.md,
  },

  barChart: { flexDirection: "row", gap: 8, height: 120, alignItems: "flex-end" },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", backgroundColor: colors.accent, borderRadius: 4, minHeight: 8 },
  barLabel: { color: colors.textSecondary, fontSize: 11 },

  donutRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  donutWrap: { position: "relative", alignItems: "center", justifyContent: "center" },
  donutCenter: {
    position: "absolute",
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: colors.card, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border,
  },
  donutCenterValue: { color: colors.textPrimary, fontWeight: "800", fontSize: 17 },
  donutCenterLabel: {
    color: colors.textSecondary, fontSize: 9, textAlign: "center", marginTop: 1,
  },
  donutLegend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  legendPct: { color: colors.textPrimary, fontWeight: "700", fontSize: 13 },

  aiHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  aiIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center",
  },
  aiTitle: { flex: 1, fontWeight: "700", color: colors.textPrimary, fontSize: 13 },
  aiBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  aiBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  aiDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },

  riskRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  riskChip: {
    flex: 1, height: 34, borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  riskChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  riskChipText: { color: colors.textSecondary, fontWeight: "600", fontSize: 12 },
  riskChipTextActive: { color: "#fff" },

  confRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  confLabel: { color: colors.textSecondary, fontSize: 13 },
  confTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" },
  confFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 4 },

  metricRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: spacing.md, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  metricLabel: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  metricVal: { fontWeight: "700", fontSize: 13, color: colors.textPrimary },

  reasonRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: spacing.sm },
  reasonDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent, marginTop: 7 },
  reasonText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 },

  convertBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    height: 46, borderRadius: radius.md, backgroundColor: colors.primary, marginTop: spacing.md,
  },
  convertBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  disclaimer: {
    color: colors.textSecondary, fontSize: 11, lineHeight: 16,
    marginTop: spacing.md, fontStyle: "italic",
  },
});
