import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AnimatedPressable from "@/components/AnimatedPressable";
import { FraudAnalysis, FraudApi } from "@/api/endpoints";
import { SubScreenHeader } from "@/components/SubScreenHeader";
import { Card } from "@/components/ui";
import { palette, colors, radius, spacing } from "@/theme/colors";
import { fonts, fontSizes } from "@/theme/typography";

function DonutChart({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = score / maxScore;
  const filledDeg = pct * 360;
  const rotation = filledDeg > 180 ? 180 : filledDeg;
  const showSecondHalf = filledDeg > 180;
  const isHighRisk = score >= 60;

  return (
    <View style={{ width: 160, height: 160, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 160, height: 160, position: "absolute" }}>
        <View
          style={{
            width: 160, height: 160, borderRadius: 80,
            borderWidth: 12, borderColor: "#FECACA",
            position: "absolute",
          }}
        />
        {filledDeg > 0 && (
          <>
            <View style={{ width: 80, height: 160, overflow: "hidden", position: "absolute", left: 0 }}>
              <View
                style={{
                  width: 160, height: 160, borderRadius: 80,
                  borderWidth: 12, borderColor: isHighRisk ? "#E7000B" : "#F59E0B",
                  position: "absolute", left: 0,
                  transform: [{ rotate: `${rotation - 180}deg` }],
                  borderRightColor: "transparent",
                  borderBottomColor: "transparent",
                }}
              />
            </View>
            {showSecondHalf && (
              <View style={{ width: 80, height: 160, overflow: "hidden", position: "absolute", right: 0 }}>
                <View
                  style={{
                    width: 160, height: 160, borderRadius: 80,
                    borderWidth: 12, borderColor: isHighRisk ? "#E7000B" : "#F59E0B",
                    position: "absolute", right: 0,
                    transform: [{ rotate: `${filledDeg - 180}deg` }],
                    borderLeftColor: "transparent",
                    borderBottomColor: "transparent",
                  }}
                />
              </View>
            )}
          </>
        )}
      </View>
      <Text style={{ fontFamily: fonts.bold, fontSize: 30, color: isHighRisk ? colors.danger : colors.warning, lineHeight: 36 }}>
        {score}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: isHighRisk ? palette.red50 : palette.amber50, lineHeight: 16 }}>
        / {maxScore}
      </Text>
    </View>
  );
}

export default function FraudScreen() {
  const router = useRouter();
  const { currency } = useLocalSearchParams<{ currency?: string }>();
  const [data, setData] = useState<FraudAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await FraudApi.analyze();
      setData(res.data);
    } catch {
      setError("Gagal memuat analisis fraud. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const riskScore = data?.risk_score ?? 0;
  const riskLevel = data?.risk_level ?? "LOW";
  const isHighRisk = riskScore >= 60;
  const riskColor = isHighRisk ? colors.danger : riskScore >= 30 ? colors.warning : colors.success;
  const riskBadgeBg = isHighRisk ? colors.danger : riskScore >= 30 ? colors.warning : colors.success;

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <SubScreenHeader title="AI Fraud Analysis" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.body, color: colors.textSecondary, paddingTop: spacing.md }}>
            Menganalisis transaksi...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <SubScreenHeader title="AI Fraud Analysis" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg }}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
          <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.body, color: colors.textSecondary, paddingTop: spacing.md, textAlign: "center" }}>
            {error}
          </Text>
          <AnimatedPressable style={[s.btnPrimary, { marginTop: spacing.lg, paddingHorizontal: spacing.xl }]} onPress={() => load()}>
            <Text style={s.btnPrimaryText}>Coba Lagi</Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!data?.has_data) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <SubScreenHeader title="AI Fraud Analysis" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg }}>
          <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
          <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.body, color: colors.textSecondary, paddingTop: spacing.md, textAlign: "center" }}>
            {data?.message || "Belum ada transaksi untuk dianalisis."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const tx = data.transaction!;
  const normal = data.normal_activity!;
  const suspicious = data.suspicious_activity!;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <SubScreenHeader title="AI Fraud Analysis" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {/* Risk Score Card */}
        <View style={[s.riskCard, { backgroundColor: isHighRisk ? palette.red10 : palette.amber10 }]}>
          <View style={{ alignItems: "center" }}>
            <DonutChart score={riskScore} maxScore={100} />
          </View>
          <View style={s.badgeRow}>
            <View style={[s.riskBadge, { backgroundColor: riskBadgeBg }]}>
              <Ionicons name="alert-circle" size={14} color="#fff" />
              <Text style={s.riskBadgeText}>{riskLevel === "HIGH" ? "High Risk" : riskLevel === "MEDIUM" ? "Medium Risk" : "Low Risk"}</Text>
            </View>
          </View>
          <Text style={[s.riskDesc, { color: isHighRisk ? palette.red50 : palette.amber50 }]}>
            Transaksi {tx.currency} sebesar {tx.currency} {tx.amount} terdeteksi {isHighRisk ? "sangat tidak biasa" : "cukup tidak biasa"} dibandingkan aktivitas normal Anda.
          </Text>
        </View>

        {/* AI Summary */}
        <Card style={{ gap: spacing.sm }}>
          <Text style={s.cardTitle}>AI Summary</Text>
          <Text style={s.summaryText}>
            Transaksi {tx.currency} {tx.amount} pada {tx.description || "transaksi tercatat"} {"\n"}
            {suspicious.is_unusual_amount && `• Jumlah sangat besar (rata-rata: ${normal.top_currency} ${normal.avg_amount_display})\n`}
            {suspicious.is_odd_hour && "• Waktu transaksi di luar jam aktivitas normal\n"}
            {suspicious.is_unusual_currency && `• Mata uang ${tx.currency} tidak biasa digunakan\n`}
            {data.factors?.map(f => `• ${f.label}`).join("\n")}
          </Text>
        </Card>

        {/* Behavioral Comparison */}
        <Card style={{ gap: spacing.sm }}>
          <Text style={s.cardTitle}>Perbandingan Perilaku</Text>

          <View style={s.sectionWrap}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: colors.success }]} />
              <Text style={s.sectionLabel}>Aktivitas Normal</Text>
            </View>
            <View style={s.sectionBody}>
              <View style={s.behaviorRow}>
                <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
                <Text style={s.behaviorText}>{normal.top_currency} {normal.avg_amount_display} rata-rata transaksi</Text>
              </View>
              <View style={s.behaviorRow}>
                <Ionicons name="globe-outline" size={14} color={colors.textSecondary} />
                <Text style={s.behaviorText}>{normal.currencies.join(", ")} digunakan</Text>
              </View>
              <View style={s.behaviorRow}>
                <Ionicons name="moon-outline" size={14} color={colors.textSecondary} />
                <Text style={s.behaviorText}>Aktivitas {normal.active_hours}</Text>
              </View>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.sectionWrap}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: colors.danger }]} />
              <Text style={s.sectionLabel}>Aktivitas Mencurigakan</Text>
            </View>
            <View style={s.sectionBody}>
              <View style={s.behaviorRow}>
                <Ionicons name="warning-outline" size={14} color={colors.danger} />
                <Text style={[s.behaviorText, { color: colors.danger }]}>{tx.currency} {suspicious.amount} transaksi</Text>
              </View>
              {suspicious.is_unusual_currency && (
                <View style={s.behaviorRow}>
                  <Ionicons name="flag-outline" size={14} color={colors.danger} />
                  <Text style={[s.behaviorText, { color: colors.danger }]}>Mata uang {suspicious.currency} tidak biasa</Text>
                </View>
              )}
              {suspicious.is_odd_hour && (
                <View style={s.behaviorRow}>
                  <Ionicons name="time-outline" size={14} color={colors.danger} />
                  <Text style={[s.behaviorText, { color: colors.danger }]}>{suspicious.time} aktivitas</Text>
                </View>
              )}
              {suspicious.is_unusual_amount && (
                <View style={s.behaviorRow}>
                  <Ionicons name="trending-up-outline" size={14} color={colors.danger} />
                  <Text style={[s.behaviorText, { color: colors.danger }]}>Jumlah di atas rata-rata</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Security Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <Card style={{ gap: spacing.sm }}>
            <Text style={s.cardTitle}>Rekomendasi Keamanan</Text>
            {data.recommendations.map((rec, i) => (
              <View key={i} style={[s.recCard, { backgroundColor: rec.bg }]}>
                <View style={s.recIconWrap}>
                  <Ionicons
                    name={
                      rec.iconColor === "#2563EB" ? "shield-checkmark-outline" :
                      rec.iconColor === "#D97706" ? "time-outline" :
                      rec.iconColor === colors.danger ? "ban-outline" : "eye-outline"
                    }
                    size={16} color={rec.iconColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.recTitle}>{rec.title}</Text>
                  <Text style={s.recDesc}>{rec.desc}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Action Buttons */}
        <View style={s.actionRow}>
          <AnimatedPressable style={s.btnPrimary} onPress={() => router.push({ pathname: "/verify", params: { amount: tx.amount, currency: tx.currency, time: suspicious.time, score: String(riskScore), level: riskLevel } })}>
            <Text style={s.btnPrimaryText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Verifikasi</Text>
          </AnimatedPressable>
          <AnimatedPressable style={s.btnSecondary} onPress={() => router.back()}>
            <Text style={s.btnSecondaryText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Kembali</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  riskCard: {
    borderRadius: radius.lg, padding: spacing.lg,
  },
  badgeRow: { alignItems: "center", paddingTop: spacing.md },
  riskBadge: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 9999,
  },
  riskBadgeText: { fontFamily: fonts.semibold, fontSize: fontSizes.body, color: "#fff" },
  riskDesc: {
    fontFamily: fonts.regular, fontSize: fontSizes.caption,
    textAlign: "center", paddingTop: spacing.md, lineHeight: 16,
  },

  cardTitle: { fontFamily: fonts.semibold, fontSize: fontSizes.body, color: colors.textPrimary },
  summaryText: { fontFamily: fonts.regular, fontSize: fontSizes.caption, color: colors.textSecondary, lineHeight: 19.5 },

  sectionWrap: {},
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontFamily: fonts.semibold, fontSize: fontSizes.caption, color: colors.textPrimary },
  sectionBody: { paddingLeft: spacing.md, paddingTop: spacing.xs },
  behaviorRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: 3 },
  behaviorText: { fontFamily: fonts.regular, fontSize: fontSizes.caption, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

  recCard: {
    flexDirection: "row", alignItems: "flex-start", gap: spacing.sm,
    borderRadius: radius.lg, padding: spacing.sm,
  },
  recIconWrap: { paddingTop: 2 },
  recTitle: { fontFamily: fonts.semibold, fontSize: fontSizes.caption, color: colors.textPrimary },
  recDesc: { fontFamily: fonts.regular, fontSize: fontSizes.micro, color: colors.textSecondary, paddingTop: 2 },

  actionRow: {
    flexDirection: "row", gap: spacing.sm,
  },
  btnPrimary: {
    flex: 1, height: 46, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
    paddingHorizontal: spacing.sm, minWidth: 0,
  },
  btnPrimaryText: { fontFamily: fonts.bold, fontSize: fontSizes.bodyAlt, color: "#fff", flexShrink: 1 },
  btnSecondary: {
    flex: 1, height: 46, borderRadius: radius.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
    paddingHorizontal: spacing.sm, minWidth: 0,
  },
  btnSecondaryText: { fontFamily: fonts.bold, fontSize: fontSizes.bodyAlt, color: colors.textPrimary, flexShrink: 1 },
});
