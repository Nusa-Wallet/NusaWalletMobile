import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FxAdvisory, InsightsApi } from "@/api/endpoints";
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

// Currency usage distribution
const CCY_USAGE = [
  { label: "USD", pct: 55, color: "#2563EB" },
  { label: "EUR", pct: 20, color: "#7C3AED" },
  { label: "SGD", pct: 18, color: "#16A34A" },
  { label: "MYR", pct: 7, color: "#F97316" },
];

const ACTION_META: Record<string, { text: string; bg: string }> = {
  CONVERT_NOW: { text: "Konversi", bg: "#0E2148" },
  WAIT: { text: "Tunggu", bg: "#D97706" },
  HOLD: { text: "Tahan", bg: "#64748B" },
};

export default function Insights() {
  const [adv, setAdv] = useState<FxAdvisory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      InsightsApi.fxAdvisory("USD", "IDR")
        .then((r) => { setAdv(r.data); setError(null); })
        .catch(() => setError("AI service offline (port 8001)."));
    }, [])
  );

  const action = adv ? ACTION_META[adv.action] : null;

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
          <Text style={s.cardTitle}>Penggunaan Mata Uang</Text>
          <View style={s.donutRow}>
            {/* Simplified ring chart */}
            <View style={s.donutWrap}>
              <View style={s.donutOuter}>
                <View style={s.donutInner} />
                {/* Colored arcs approximated with border trick */}
                <View style={[s.donutArc, { borderColor: "#2563EB" }]} />
              </View>
              {/* Colored overlay segments */}
              <View style={[StyleSheet.absoluteFill, s.donutOuter, { borderColor: "#7C3AED", opacity: 0.8,
                transform: [{ rotate: "198deg" }] }]} />
              <View style={[StyleSheet.absoluteFill, s.donutOuter, { borderColor: "#16A34A", opacity: 0.8,
                transform: [{ rotate: "270deg" }] }]} />
              <View style={[StyleSheet.absoluteFill, s.donutOuter, { borderColor: "#F97316", opacity: 0.9,
                transform: [{ rotate: "334.8deg" }] }]} />
              <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
                <View style={s.donutHole} />
              </View>
            </View>

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
              <Text style={s.aiTitle}>Rekomendasi AI</Text>
              <View style={[s.aiBadge, { backgroundColor: action.bg }]}>
                <Text style={s.aiBadgeText}>{action.text}</Text>
              </View>
            </View>

            <Text style={s.aiDesc}>{adv.rationale}</Text>

            {/* Confidence bar */}
            <View style={{ marginTop: spacing.md }}>
              <View style={s.confRow}>
                <Text style={s.confLabel}>Confidence</Text>
                <Text style={[s.confLabel, { color: colors.accent, fontWeight: "700" }]}>
                  {(adv.confidence * 100).toFixed(0)}%
                </Text>
              </View>
              <View style={s.confTrack}>
                <View style={[s.confFill, { width: `${adv.confidence * 100}%` }]} />
              </View>
            </View>

            {/* Scenarios */}
            <View style={s.scenarioRow}>
              <View style={s.scenarioCard}>
                <Text style={s.scenarioLabel}>Terbaik</Text>
                <Text style={[s.scenarioVal, { color: "#16A34A" }]}>
                  +Rp {Math.round((adv.scenario_best - adv.current_rate) * 1000).toLocaleString("id-ID")}
                </Text>
                <Text style={s.scenarioSub}>Rp {adv.scenario_best.toLocaleString("id-ID")}</Text>
              </View>
              <View style={s.scenarioCard}>
                <Text style={s.scenarioLabel}>Moderat</Text>
                <Text style={[s.scenarioVal, { color: colors.textSecondary }]}>– –</Text>
                <Text style={s.scenarioSub}>Rp {adv.current_rate.toLocaleString("id-ID")}</Text>
              </View>
            </View>
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

  // Summary
  summaryRow: { flexDirection: "row", gap: spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  summaryLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  summaryVal: { color: colors.textPrimary, fontWeight: "800", fontSize: 18 },

  // Card
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.md },

  // Bar chart
  barChart: { flexDirection: "row", gap: 8, height: 120, alignItems: "flex-end" },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", backgroundColor: colors.accent, borderRadius: 4, minHeight: 8 },
  barLabel: { color: colors.textSecondary, fontSize: 11 },

  // Donut
  donutRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  donutWrap: { width: 110, height: 110 },
  donutOuter: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 20, borderColor: "#2563EB",
  },
  donutArc: { width: 110, height: 110, borderRadius: 55, borderWidth: 20 },
  donutHole: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.card },
  donutLegend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  legendPct: { color: colors.textPrimary, fontWeight: "700", fontSize: 13 },

  // AI card
  aiHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  aiIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center",
  },
  aiTitle: { flex: 1, fontWeight: "700", color: colors.textPrimary },
  aibadge: {},
  aiBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  aiBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  aiDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  confRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  confLabel: { color: colors.textSecondary, fontSize: 13 },
  confTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" },
  confFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 4 },
  scenarioRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  scenarioCard: {
    flex: 1, backgroundColor: colors.background,
    borderRadius: radius.md, padding: spacing.sm, gap: 2,
  },
  scenarioLabel: { color: colors.textSecondary, fontSize: 12 },
  scenarioVal: { fontWeight: "700", fontSize: 15 },
  scenarioSub: { color: colors.textSecondary, fontSize: 11 },
});
