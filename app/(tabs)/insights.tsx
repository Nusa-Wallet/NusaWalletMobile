import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";

import {
  FxAdvisory,
  InsightsApi,
  LedgerEntry,
  RiskPreference,
  WalletApi,
  WalletBalance,
} from "@/api/endpoints";
import { Card } from "@/components/ui";
import { ErrorView } from "@/components/ErrorView";
import { Skeleton } from "@/components/Skeleton";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
import { cardWidth, scale, scaleFont } from "@/utils/responsive";
import { CCY_COLORS } from "@/constants";
import AnimatedPressable from "@/components/AnimatedPressable";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

type CurrencyUsage = { label: string; pct: number; color: string };

function CurrencyUsageDonut({ data, size = 140 }: { data: CurrencyUsage[]; size?: number }) {
  const center = size / 2;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;
  const accessibility = data.map((c) => `${c.label} ${c.pct} persen`).join(", ");

  return (
    <View
      style={[s.donutWrap, { width: size, height: size }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Komposisi saldo valas: ${accessibility}`}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
        />
        <G rotation="-90" origin={`${center}, ${center}`}>
          {data.map((currency) => {
            const segmentLength = (currency.pct / 100) * circumference;
            const offset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += currency.pct;
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

const RISK_OPTIONS: { key: RiskPreference; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  { key: "CONSERVATIVE", label: "Hati-hati", icon: "shield-outline", desc: "Prioritas keamanan" },
  { key: "MODERATE", label: "Moderat", icon: "options-outline", desc: "Seimbang" },
  { key: "AGGRESSIVE", label: "Agresif", icon: "trending-up-outline", desc: "Potensi maksimal" },
];

const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

function toIdr(amount: number, currency: string, rates: Record<string, number>) {
  return amount * (rates[currency] ?? 0);
}

function buildCurrencyUsage(wallets: WalletBalance[], rates: Record<string, number>): CurrencyUsage[] {
  const values = wallets
    .filter((w) => w.currency !== "IDR")
    .map((w) => ({
      label: w.currency,
      value: toIdr(Number(w.balance), w.currency, rates),
      color: CCY_COLORS[w.currency] ?? colors.accent,
    }))
    .filter((w) => w.value > 0);
  const total = values.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return [{ label: "IDR", pct: 100, color: CCY_COLORS.IDR }];
  return values.map((item) => ({
    label: item.label,
    pct: Math.round((item.value / total) * 100),
    color: item.color,
  }));
}

function buildMonthlyIncome(entries: LedgerEntry[], rates: Record<string, number>) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()], val: 0 };
  });
  for (const entry of entries) {
    if (entry.direction !== "CREDIT") continue;
    const d = new Date(entry.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const month = months.find((m) => m.key === key);
    if (month) month.val += toIdr(Number(entry.amount), entry.currency, rates) / 1_000_000;
  }
  return months.map(({ label, val }) => ({ label, val: Math.round(val * 10) / 10 }));
}

export default function Insights() {
  const { width: screenWidth } = useWindowDimensions();
  const donutSize = scale(140, screenWidth);
  const summaryIconSize = scale(20, screenWidth);
  const [adv, setAdv] = useState<FxAdvisory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [risk, setRisk] = useState<RiskPreference>("MODERATE");
  const [usdBalance, setUsdBalance] = useState(1000);
  const [converting, setConverting] = useState(false);
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [recent, setRecent] = useState<LedgerEntry[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({ IDR: 1 });
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const recommendationRequest = useRef(0);

  const fetchAll = useCallback(async (rp: RiskPreference, isRefresh = false) => {
    const requestId = ++recommendationRequest.current;
    if (isRefresh) setRefreshing(true);
    else setRecommendationLoading(true);
    let amount = 1000;
    try {
      const [{ data: walletData }, { data: rateData }, { data: recentData }] = await Promise.all([
        WalletApi.list(),
        WalletApi.rates(),
        WalletApi.recentTransactions(50),
      ]);
      if (requestId === recommendationRequest.current) {
        setWallets(walletData);
        setRates(rateData);
        setRecent(recentData);
      }
      amount = Number(walletData.find((w) => w.currency === "USD")?.balance ?? 0) || 1000;
      if (requestId === recommendationRequest.current) setUsdBalance(amount);
    } catch {
      /* keep default amount */
    }
    try {
      const { data } = await InsightsApi.fxAdvisory("USD", "IDR", {
        amount,
        horizon_days: 7,
        risk_preference: rp,
      });
      if (requestId === recommendationRequest.current) {
        setAdv(data);
        setError(null);
      }
    } catch {
      if (requestId === recommendationRequest.current) {
        setError("Layanan AI tidak tersedia (port 8001).");
      }
    } finally {
      if (requestId === recommendationRequest.current) {
        setRecommendationLoading(false);
        setRefreshing(false);
      }
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
  const monthly = buildMonthlyIncome(recent, rates);
  const barMax = Math.max(...monthly.map((m) => m.val), 1);
  const currencyUsage = buildCurrencyUsage(wallets, rates);
  const incomeIdr = recent
    .filter((e) => e.direction === "CREDIT")
    .reduce((sum, e) => sum + toIdr(Number(e.amount), e.currency, rates), 0);
  const projectedSavings = Math.max(gain ?? 0, 0);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(risk, true)} tintColor={colors.accent} />}
      >
        <StaggerFadeIn index={0}>
          <Text style={s.header}>Insights</Text>
        </StaggerFadeIn>

        {/* Summary cards */}
        <StaggerFadeIn index={1}>
          <View style={s.summaryRow}>
            <Card style={{ flex: 1 }}>
              <Ionicons name="trending-up" size={20} color={colors.accent} />
              <Text style={s.summaryLabel}>Pendapatan</Text>
              <Text style={s.summaryVal}>{rupiah(incomeIdr)}</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={s.summaryLabel}>Potensi hemat</Text>
              <Text style={s.summaryVal}>{rupiah(projectedSavings)}</Text>
            </Card>
          </View>
        </StaggerFadeIn>

        {/* Bar chart */}
        <StaggerFadeIn index={2}>
          <Card>
            <Text style={s.cardTitle}>Pendapatan Bulanan (Juta Rp)</Text>
            <View style={s.barChart}>
              {monthly.map((m) => (
                <View key={m.label} style={s.barCol}>
                  <View style={s.barTrack}>
                    {m.val > 0 && (
                      <View style={[s.bar, { height: `${Math.max((m.val / barMax) * 100, 8)}%` }]} />
                    )}
                  </View>
                  <Text style={s.barLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        </StaggerFadeIn>

        {/* Currency donut */}
        <StaggerFadeIn index={3}>
          <Card>
            <Text style={[s.cardTitle, { marginBottom: 4 }]}>Penggunaan Mata Uang</Text>
            <Text style={s.chartSubtitle}>
              Proporsi nilai saldo valas berdasarkan kurs backend.
            </Text>
            <View style={s.donutRow}>
              <CurrencyUsageDonut data={currencyUsage} size={donutSize} />

              <View style={s.donutLegend}>
                {currencyUsage.map((c) => (
                  <View key={c.label} style={s.legendRow}>
                    <View style={[s.legendDot, { backgroundColor: c.color }]} />
                    <Text style={s.legendLabel}>{c.label}</Text>
                    <Text style={s.legendPct}>{c.pct}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </StaggerFadeIn>

        {/* AI Recommendation */}
        <StaggerFadeIn index={4}>
          {error && (
            <Card>
              <Text style={{ color: colors.danger, fontSize: fontSizes.caption }}>{error}</Text>
            </Card>
          )}

          {recommendationLoading && !adv && (
            <Card>
              <View style={s.recommendationLoading}>
                <Skeleton width={200} height={14} />
                <Skeleton width={140} height={12} style={{ marginTop: 4 }} />
              </View>
            </Card>
          )}

          {adv && action && (
            <Card>
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
              <View style={s.riskSection}>
                <Text style={s.riskSectionLabel}>Preferensi Risiko</Text>
                <View style={s.riskRow}>
                  {RISK_OPTIONS.map((o) => {
                    const isActive = risk === o.key;
                    return (
                      <AnimatedPressable
                        key={o.key}
                        disabled={recommendationLoading}
                        onPress={() => {
                          if (isActive) return;
                          setRecommendationLoading(true);
                          setRisk(o.key);
                        }}
                        style={{ flex: 1 }}
                      >
                        <View
                          style={[
                            s.riskChip,
                            isActive && s.riskChipActive,
                            recommendationLoading && s.riskChipDisabled,
                          ]}
                        >
                          <View style={[s.riskChipIconWrap, isActive && s.riskChipIconWrapActive]}>
                            <Ionicons
                              name={o.icon}
                              size={16}
                              color={isActive ? "#fff" : colors.textSecondary}
                            />
                          </View>
                          <View style={{ gap: 1 }}>
                            <Text style={[s.riskChipText, isActive && s.riskChipTextActive]}>
                              {o.label}
                            </Text>
                            <Text style={[s.riskChipDesc, isActive && s.riskChipDescActive]}>
                              {o.desc}
                            </Text>
                          </View>
                        </View>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </View>

              {recommendationLoading ? (
                <View style={s.recommendationLoading}>
                  <Skeleton width={200} height={14} />
                  <Skeleton width={140} height={12} style={{ marginTop: 4 }} />
                </View>
              ) : (
                <>
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
                    <AnimatedPressable
                      style={s.convertBtn}
                      onPress={convertSplit}
                      disabled={converting}
                    >
                      <Ionicons name="swap-horizontal-outline" size={16} color="#fff" />
                      <Text style={s.convertBtnText}>
                        {converting ? "Memproses..." : `Konversi ${pct}% USD sekarang`}
                      </Text>
                    </AnimatedPressable>
                  )}

                  <Text style={s.disclaimer}>
                    Estimasi berbasis data historis & skenario — bukan jaminan keuntungan. Kurs
                    dapat berubah sewaktu-waktu.
                  </Text>
                </>
              )}
            </Card>
          )}
        </StaggerFadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  header: { fontSize: fontSizes.h5, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },

  summaryRow: { flexDirection: "row", gap: spacing.sm },
  summaryLabel: { color: colors.textSecondary, fontSize: fontSizes.label, marginTop: 4 },
  summaryVal: { color: colors.textPrimary, fontWeight: "800", fontSize: fontSizes.h4 },

  cardTitle: { fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.md },
  chartSubtitle: {
    color: colors.textSecondary, fontSize: fontSizes.label, lineHeight: 18,
    marginBottom: spacing.md,
  },

  barChart: { flexDirection: "row", gap: 8, height: 120, alignItems: "flex-end" },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", backgroundColor: colors.accent, borderRadius: 4, minHeight: 8 },
  barLabel: { color: colors.textSecondary, fontSize: fontSizes.small },

  donutRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  donutWrap: { position: "relative", alignItems: "center", justifyContent: "center" },
  donutCenter: {
    position: "absolute",
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: colors.card, alignItems: "center", justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  donutCenterValue: { color: colors.textPrimary, fontWeight: "800", fontSize: fontSizes.h6 },
  donutCenterLabel: {
    color: colors.textSecondary, fontSize: fontSizes.tiny, textAlign: "center", marginTop: 1,
  },
  donutLegend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, color: colors.textSecondary, fontSize: fontSizes.caption },
  legendPct: { color: colors.textPrimary, fontWeight: "700", fontSize: fontSizes.caption },

  aiHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  aiIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: `${colors.accent}12`, alignItems: "center", justifyContent: "center",
  },
  aiTitle: { flex: 1, fontWeight: "700", color: colors.textPrimary, fontSize: fontSizes.caption },
  aiBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  aiBadgeText: { color: "#fff", fontWeight: "700", fontSize: fontSizes.label },
  aiDesc: { color: colors.textSecondary, fontSize: fontSizes.caption, lineHeight: 20 },

  riskSection: { marginBottom: spacing.md, marginTop: spacing.sm },
  riskSectionLabel: { fontSize: fontSizes.label, fontWeight: "600", color: colors.textSecondary, letterSpacing: 0.5, marginBottom: spacing.sm },
  riskRow: { flexDirection: "row", gap: spacing.sm },
  riskChip: {
    flex: 1, borderRadius: radius.md, alignItems: "center", paddingVertical: 12, paddingHorizontal: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  riskChipActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
    elevation: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  riskChipDisabled: { opacity: 0.65 },
  riskChipIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.background, alignItems: "center", justifyContent: "center",
  },
  riskChipIconWrapActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  riskChipText: { color: colors.textSecondary, fontWeight: "600", fontSize: fontSizes.small, textAlign: "center" },
  riskChipTextActive: { color: "#fff" },
  riskChipDesc: { color: colors.textTertiary, fontSize: fontSizes.tiny, textAlign: "center" },
  riskChipDescActive: { color: "rgba(255,255,255,0.7)" },

  recommendationLoading: {
    minHeight: 112, alignItems: "center", justifyContent: "center", gap: spacing.sm,
  },
  recommendationLoadingTitle: { color: colors.textPrimary, fontWeight: "700", fontSize: fontSizes.bodyAlt },
  recommendationLoadingText: { color: colors.textSecondary, fontSize: fontSizes.label, textAlign: "center" },

  confRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  confLabel: { color: colors.textSecondary, fontSize: fontSizes.caption },
  confTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" },
  confFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 4 },

  metricRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: spacing.md, paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator,
  },
  metricLabel: { flex: 1, color: colors.textSecondary, fontSize: fontSizes.caption },
  metricVal: { fontWeight: "700", fontSize: fontSizes.caption, color: colors.textPrimary },

  reasonRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: spacing.sm },
  reasonDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent, marginTop: 7 },
  reasonText: { flex: 1, color: colors.textSecondary, fontSize: fontSizes.label, lineHeight: 18 },

  convertBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    height: 46, borderRadius: radius.md, backgroundColor: colors.primary, marginTop: spacing.md,
  },
  convertBtnText: { color: "#fff", fontWeight: "700", fontSize: fontSizes.bodyAlt },

  disclaimer: {
    color: colors.textSecondary, fontSize: fontSizes.small, lineHeight: 16,
    marginTop: spacing.md, fontStyle: "italic",
  },
});
