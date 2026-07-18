import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LedgerEntry, WalletApi, WalletBalance } from "@/api/endpoints";
import { MiniChart } from "@/components/MiniChart";
import { colors, radius, spacing } from "@/theme/colors";

const FLAGS: Record<string, string> = { IDR: "🇮🇩", USD: "🇺🇸", SGD: "🇸🇬", EUR: "🇪🇺", MYR: "🇲🇾" };
const SYMBOLS: Record<string, string> = { IDR: "Rp", USD: "$", SGD: "S$", EUR: "€", MYR: "RM" };
const DAYS = ["S", "S", "R", "K", "J", "S", "M"];

// Fallback display rates (updated by /wallets/rates when online).
const FALLBACK_RATES: Record<string, number> = {
  IDR: 1, USD: 15850, SGD: 12050, EUR: 17200, MYR: 3450,
};
const FX_TARGETS = ["USD", "SGD", "EUR", "MYR"];

function buildRateTrend(rate: number) {
  if (rate <= 1) return [1, 1, 1, 1, 1, 1, 1];
  return [0.986, 0.992, 0.989, 0.997, 1.001, 1.006, 1].map((scale) =>
    Math.round(rate * scale),
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.floor(diff / 60_000)}m lalu`;
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

export default function WalletScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [active, setActive] = useState("USD");
  const [target, setTarget] = useState("IDR");
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);

  const load = useCallback(() => {
    WalletApi.list().then((r) => setWallets(r.data)).catch(() => {});
    WalletApi.history(active).then((r) => setHistory(r.data)).catch(() => {});
    WalletApi.rates().then((r) => setRates(r.data)).catch(() => {});
  }, [active]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const current = wallets.find((w) => w.currency === active);
  const balance = Number(current?.balance ?? 0);
  const chartW = width - spacing.lg * 2;
  const targetOptions = useMemo(
    () => (active === "IDR" ? FX_TARGETS : ["IDR"]),
    [active],
  );

  useEffect(() => {
    setTarget(active === "IDR" ? "USD" : "IDR");
  }, [active]);

  const targetRateLabel = active === "IDR"
    ? `1 ${target} = Rp ${(rates[target] ?? FALLBACK_RATES[target] ?? 0).toLocaleString("id-ID")}`
    : `1 ${active} = Rp ${(rates[active] ?? FALLBACK_RATES[active] ?? 0).toLocaleString("id-ID")}`;

  async function handleConvert() {
    if (balance <= 0) return Alert.alert("Saldo kosong", "Tidak ada saldo untuk dikonversi.");
    if (active === target) return Alert.alert("Tujuan tidak valid", "Pilih mata uang tujuan yang berbeda.");
    try {
      const { data } = await WalletApi.convert(active, target, balance);
      Alert.alert(
        "Konversi berhasil",
        `+${target} ${Number(data.amount_out).toLocaleString("en-US")}\nFee: ${target} ${Number(data.fee).toLocaleString("en-US")}`
      );
      load();
    } catch (e: any) {
      Alert.alert("Gagal", e?.response?.data?.detail ?? "Konversi gagal.");
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={s.header}>
          <View style={{ width: 28 }} />
          <Text style={s.headerTitle}>Dompet</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Currency tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabs}
        >
          {wallets.map((w) => (
            <TouchableOpacity
              key={w.currency}
              onPress={() => setActive(w.currency)}
              style={[s.tab, active === w.currency && s.tabActive]}
            >
              <Text style={s.tabFlag}>{FLAGS[w.currency]}</Text>
              <Text style={[s.tabText, active === w.currency && s.tabTextActive]}>
                {w.currency}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Currency detail card */}
        <View style={s.card}>
          <View style={s.cardTop}>
            <Text style={{ fontSize: 32 }}>{FLAGS[active]}</Text>
            <View style={{ marginLeft: spacing.sm }}>
              <Text style={s.cardCcy}>{active}</Text>
              {active !== "IDR" && (
                <Text style={s.cardRate}>
                  1 {active} = Rp {(rates[active] ?? 0).toLocaleString("id-ID")}
                </Text>
              )}
              {active === "IDR" && <Text style={s.cardRate}>{targetRateLabel}</Text>}
            </View>
          </View>

          <View style={s.amountsRow}>
            <View>
              <Text style={s.amtLabel}>Tersedia</Text>
              <Text style={s.amtValue}>
                {SYMBOLS[active]}{balance.toLocaleString("en-US")}
              </Text>
            </View>
            <View>
              <Text style={s.amtLabel}>Pending</Text>
              <Text style={[s.amtValue, { color: "#F59E0B" }]}>{SYMBOLS[active]}0</Text>
            </View>
          </View>

          <View style={s.convertBox}>
            <Text style={s.amtLabel}>Tujuan konversi</Text>
            <View style={s.targetRow}>
              {targetOptions.map((ccy) => (
                <TouchableOpacity
                  key={ccy}
                  onPress={() => setTarget(ccy)}
                  style={[s.targetChip, target === ccy && s.targetChipActive]}
                >
                  <Text style={s.targetFlag}>{FLAGS[ccy]}</Text>
                  <Text style={[s.targetText, target === ccy && s.targetTextActive]}>
                    {ccy}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.btnRow}>
            <TouchableOpacity style={[s.actionBtn, { flex: 1 }]} onPress={handleConvert}>
              <Ionicons name="swap-horizontal-outline" size={16} color="#fff" />
              <Text style={s.actionBtnText}>Konversi ke {target}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnAlt, { flex: 1 }]}
              onPress={() => router.push("/(tabs)/insights")}
            >
              <Ionicons name="sparkles-outline" size={16} color="#fff" />
              <Text style={s.actionBtnText}>AI Rekom</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trend chart */}
        {active !== "IDR" && (
          <View style={[s.card, { marginTop: spacing.md }]}>
            <Text style={s.sectionTitle}>Tren Kurs Minggu Ini</Text>
            <MiniChart
              data={buildRateTrend(rates[active] ?? FALLBACK_RATES[active] ?? 1)}
              color={colors.accent}
              width={chartW}
              height={80}
            />
            <View style={s.dayLabels}>
              {DAYS.map((d, i) => (
                <Text key={i} style={s.dayLabel}>{d}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Riwayat */}
        <View style={[s.card, { marginTop: spacing.md }]}>
          <Text style={s.sectionTitle}>Riwayat</Text>
          {history.length === 0 && (
            <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>Belum ada transaksi.</Text>
          )}
          {history.map((e, i) => (
            <View
              key={e.id}
              style={[s.txRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
            >
              <View style={[s.txDot, { backgroundColor: e.direction === "CREDIT" ? "#16A34A" : "#F97316" }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.txDesc}>{e.description ?? e.ref_type}</Text>
                <Text style={s.txTime}>{timeAgo(e.created_at)}</Text>
              </View>
              <Text style={[s.txAmt, { color: e.direction === "CREDIT" ? "#16A34A" : colors.textPrimary }]}>
                {e.direction === "CREDIT" ? "+" : "-"}{SYMBOLS[e.currency] ?? ""}{Number(e.amount).toLocaleString("en-US")}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },

  tabs: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabFlag: { fontSize: 16 },
  tabText: { color: colors.textSecondary, fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#fff" },

  card: {
    marginHorizontal: spacing.lg, backgroundColor: colors.card,
    borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  cardCcy: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  cardRate: { color: colors.textSecondary, fontSize: 13 },

  amountsRow: { flexDirection: "row", gap: spacing.xl, marginBottom: spacing.md },
  amtLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 2 },
  amtValue: { fontSize: 26, fontWeight: "800", color: colors.textPrimary },
  convertBox: { marginBottom: spacing.md },
  targetRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 8 },
  targetChip: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, minWidth: 78, height: 38, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
  },
  targetChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  targetFlag: { fontSize: 15 },
  targetText: { color: colors.textSecondary, fontWeight: "700", fontSize: 13 },
  targetTextActive: { color: "#fff" },

  btnRow: { flexDirection: "row", gap: spacing.sm },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, height: 46, borderRadius: radius.md, backgroundColor: colors.primary,
  },
  actionBtnAlt: { backgroundColor: "#1E3A6E" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm },
  dayLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  dayLabel: { color: colors.textSecondary, fontSize: 11, textAlign: "center" },

  txRow: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.md, paddingVertical: 12,
  },
  txDot: { width: 10, height: 10, borderRadius: 5 },
  txDesc: { fontWeight: "600", color: colors.textPrimary, fontSize: 14 },
  txTime: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  txAmt: { fontWeight: "700", fontSize: 15 },
});
