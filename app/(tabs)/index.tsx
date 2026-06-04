import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WalletApi, WalletBalance } from "@/api/endpoints";
import { Card } from "@/components/ui";
import { colors, radius, spacing } from "@/theme/colors";

// Beranda — Design 07. Primary balance + quick actions + wallets summary.
const QUICK = [
  { icon: "download-outline", label: "Terima" },
  { icon: "swap-horizontal-outline", label: "Konversi" },
  { icon: "send-outline", label: "Kirim" },
  { icon: "bar-chart-outline", label: "Insights" },
];

export default function Home() {
  const [wallets, setWallets] = useState<WalletBalance[]>([]);

  useFocusEffect(
    useCallback(() => {
      WalletApi.list().then((r) => setWallets(r.data)).catch(() => {});
    }, [])
  );

  const idr = wallets.find((w) => w.currency === "IDR");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={styles.greeting}>Selamat datang,</Text>
        <Text style={styles.name}>Andi Rizky</Text>

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Saldo (IDR)</Text>
          <Text style={styles.balanceValue}>
            Rp {Number(idr?.balance ?? 0).toLocaleString("id-ID")}
          </Text>
        </Card>

        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <View key={q.label} style={styles.quick}>
              <View style={styles.quickIcon}>
                <Ionicons name={q.icon as any} size={22} color={colors.accent} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Dompet Saya</Text>
        {wallets
          .filter((w) => w.currency !== "IDR")
          .map((w) => (
            <Card key={w.currency} style={styles.walletRow}>
              <Text style={styles.walletCcy}>{w.currency}</Text>
              <Text style={styles.walletBal}>
                {Number(w.balance).toLocaleString("en-US")}
              </Text>
            </Card>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  greeting: { color: colors.textSecondary },
  name: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  balanceCard: { backgroundColor: colors.primary, borderColor: colors.primary },
  balanceLabel: { color: "#A8B6CF" },
  balanceValue: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: spacing.xs },
  quickRow: { flexDirection: "row", justifyContent: "space-between" },
  quick: { alignItems: "center", gap: 6, flex: 1 },
  quickIcon: {
    width: 52, height: 52, borderRadius: radius.md, backgroundColor: "#E5EDFB",
    alignItems: "center", justifyContent: "center",
  },
  quickLabel: { fontSize: 12, color: colors.textSecondary },
  section: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.sm },
  walletRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletCcy: { fontWeight: "700", color: colors.textPrimary },
  walletBal: { color: colors.textPrimary },
});
