import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LedgerEntry, WalletApi, WalletBalance } from "@/api/endpoints";
import { Button, Card } from "@/components/ui";
import { colors, radius, spacing } from "@/theme/colors";

// Dompet — Design 08/09. Currency tabs, balance, convert, history.
export default function WalletScreen() {
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [active, setActive] = useState("USD");
  const [history, setHistory] = useState<LedgerEntry[]>([]);

  const load = useCallback(() => {
    WalletApi.list().then((r) => setWallets(r.data)).catch(() => {});
    WalletApi.history(active).then((r) => setHistory(r.data)).catch(() => {});
  }, [active]);

  useFocusEffect(useCallback(() => load(), [load]));

  const current = wallets.find((w) => w.currency === active);

  async function convertToIdr() {
    try {
      const amount = Number(current?.balance ?? 0);
      if (amount <= 0) return Alert.alert("Saldo kosong", "Tidak ada saldo untuk dikonversi.");
      const { data } = await WalletApi.convert(active, "IDR", amount);
      Alert.alert("Konversi berhasil", `Diterima Rp ${Number(data.amount_out).toLocaleString("id-ID")}`);
      load();
    } catch (e: any) {
      Alert.alert("Gagal", e?.response?.data?.detail ?? "Konversi gagal.");
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={styles.header}>Dompet</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {wallets.map((w) => (
            <Pressable
              key={w.currency}
              onPress={() => setActive(w.currency)}
              style={[styles.tab, active === w.currency && styles.tabActive]}
            >
              <Text style={[styles.tabText, active === w.currency && styles.tabTextActive]}>
                {w.currency}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Card>
          <Text style={styles.ccy}>{active}</Text>
          <Text style={styles.balance}>
            {Number(current?.balance ?? 0).toLocaleString("en-US")}
          </Text>
          {active !== "IDR" && (
            <Button title={`Konversi ke IDR`} onPress={convertToIdr} style={{ marginTop: spacing.md }} />
          )}
        </Card>

        <Text style={styles.section}>Riwayat</Text>
        {history.length === 0 && <Text style={styles.empty}>Belum ada transaksi.</Text>}
        {history.map((e) => (
          <Card key={e.id} style={styles.histRow}>
            <View>
              <Text style={styles.histDesc}>{e.description ?? e.ref_type}</Text>
              <Text style={styles.histDate}>{new Date(e.created_at).toLocaleDateString("id-ID")}</Text>
            </View>
            <Text style={[styles.histAmt, { color: e.direction === "CREDIT" ? colors.success : colors.danger }]}>
              {e.direction === "CREDIT" ? "+" : "-"}
              {Number(e.amount).toLocaleString("en-US")}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  ccy: { color: colors.textSecondary },
  balance: { fontSize: 30, fontWeight: "800", color: colors.textPrimary, marginTop: spacing.xs },
  section: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.sm },
  empty: { color: colors.textSecondary },
  histRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  histDesc: { color: colors.textPrimary, fontWeight: "600" },
  histDate: { color: colors.textSecondary, fontSize: 12 },
  histAmt: { fontWeight: "700" },
});
