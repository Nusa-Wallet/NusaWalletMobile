import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FxAdvisory, InsightsApi } from "@/api/endpoints";
import { Card } from "@/components/ui";
import { colors, radius, spacing } from "@/theme/colors";

// Insights — Design 12. AI FX recommendation (Decision-Support).
const ACTION_LABEL: Record<string, { text: string; color: string }> = {
  CONVERT_NOW: { text: "Konversi Sekarang", color: colors.success },
  WAIT: { text: "Tunggu", color: colors.warning },
  HOLD: { text: "Tahan", color: colors.textSecondary },
};

export default function Insights() {
  const [adv, setAdv] = useState<FxAdvisory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      InsightsApi.fxAdvisory("SGD", "IDR")
        .then((r) => { setAdv(r.data); setError(null); })
        .catch(() => setError("AI service belum aktif (jalankan NusaWalletAI di port 8001)."));
    }, [])
  );

  const action = adv ? ACTION_LABEL[adv.action] : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={styles.header}>Insights</Text>

        {error && <Card><Text style={{ color: colors.danger }}>{error}</Text></Card>}

        {adv && (
          <Card style={{ gap: spacing.sm }}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Rekomendasi AI · {adv.pair}</Text>
              <View style={[styles.badge, { backgroundColor: action?.color }]}>
                <Text style={styles.badgeText}>{action?.text}</Text>
              </View>
            </View>
            <Text style={styles.rationale}>{adv.rationale}</Text>

            <View style={styles.metricRow}>
              <Metric label="Kurs Sekarang" value={adv.current_rate.toLocaleString("id-ID")} />
              <Metric label="Rata-rata 7H" value={adv.ma_7d.toLocaleString("id-ID")} />
            </View>
            <View style={styles.metricRow}>
              <Metric label="Skenario Terbaik" value={adv.scenario_best.toLocaleString("id-ID")} />
              <Metric label="Skenario Terburuk" value={adv.scenario_worst.toLocaleString("id-ID")} />
            </View>

            <View style={styles.confRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
              <Text style={styles.conf}>Confidence Level: {(adv.confidence * 100).toFixed(0)}%</Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  cardTitle: { fontWeight: "700", color: colors.textPrimary, flex: 1 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  rationale: { color: colors.textSecondary, lineHeight: 20 },
  metricRow: { flexDirection: "row", gap: spacing.sm },
  metric: { flex: 1, backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.sm },
  metricLabel: { color: colors.textSecondary, fontSize: 12 },
  metricValue: { color: colors.textPrimary, fontWeight: "700", fontSize: 16 },
  confRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.xs },
  conf: { color: colors.accent, fontWeight: "600" },
});
