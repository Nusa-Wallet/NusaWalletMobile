import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LedgerEntry, WalletApi, WalletBalance } from "@/api/endpoints";
import { colors, radius, spacing } from "@/theme/colors";
import { formatMoney, formatRate, tidyDescription } from "@/utils/format";

const FLAGS: Record<string, string> = { IDR: "🇮🇩", USD: "🇺🇸", SGD: "🇸🇬", EUR: "🇪🇺", MYR: "🇲🇾" };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.floor(diff / 60_000)}m lalu`;
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

export default function Home() {
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [recent, setRecent] = useState<LedgerEntry[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({ IDR: 1 });

  useFocusEffect(
    useCallback(() => {
      WalletApi.list().then((r) => setWallets(r.data)).catch(() => {});
      WalletApi.recentTransactions(5).then((r) => setRecent(r.data)).catch(() => {});
      WalletApi.rates().then((r) => setRates(r.data)).catch(() => {});
    }, [])
  );

  const idrBalance = Number(wallets.find((w) => w.currency === "IDR")?.balance ?? 0);
  const nonIdr = wallets.filter((w) => w.currency !== "IDR");
  const totalIdr = wallets.reduce(
    (sum, w) => sum + Number(w.balance) * (rates[w.currency] ?? 0),
    0,
  );
  const incomingIdr = recent
    .filter((e) => e.direction === "CREDIT")
    .reduce((sum, e) => sum + Number(e.amount) * (rates[e.currency] ?? 0), 0);
  const activeCurrencyCount = wallets.filter((w) => Number(w.balance) > 0).length;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HEADER CARD ─────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerTopRow}>
            <View>
              <Text style={s.greeting}>Selamat datang,</Text>
              <Text style={s.name}>Andi Rizky</Text>
            </View>
            <View style={s.bellWrap}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              <View style={s.bellBadge} />
            </View>
          </View>

          <Text style={s.saldoLabel}>Total Saldo Ekuivalen</Text>
          <Text style={s.saldoValue}>{formatMoney(totalIdr || idrBalance, "IDR")}</Text>

          <View style={s.statsRow}>
            {[
              {
                icon: "arrow-down-outline",
                label: "Masuk",
                val: `${Math.round(incomingIdr / 1_000_000)}M`,
                color: "#94A3B8",
              },
              { icon: "wallet-outline", label: "Currency", val: `${activeCurrencyCount}`, color: "#94A3B8" },
              { icon: "receipt-outline", label: "Riwayat", val: `${recent.length}`, color: "#94A3B8" },
            ].map((stat, i) => (
              <View key={stat.label} style={{ flexDirection: "row", flex: 1 }}>
                {i > 0 && <View style={s.statDivider} />}
                <View style={s.stat}>
                  <Ionicons name={stat.icon as any} size={13} color={stat.color} />
                  <Text style={s.statLabel}>{stat.label}</Text>
                  <Text style={s.statVal}>{stat.val}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={s.body}>
          {/* ── DOMPET SAYA ───────────────────────────── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Dompet Saya</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: 4 }}
          >
            {nonIdr.map((w) => {
              const rate = rates[w.currency] ?? 0;
              return (
                <TouchableOpacity
                  key={w.currency}
                  style={s.walletCard}
                  onPress={() => router.push("/(tabs)/wallet")}
                >
                  <View style={s.walletCardTop}>
                    <Text style={s.flagEmoji}>{FLAGS[w.currency]}</Text>
                    <Text style={s.walletCcy}>{w.currency}</Text>
                    <View style={s.chgPill}>
                      <Text style={s.chgText}>Rp {formatRate(rate)}</Text>
                    </View>
                  </View>
                  <Text style={s.walletBal}>
                    {formatMoney(Number(w.balance), w.currency, true)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── TRANSAKSI TERBARU ─────────────────────── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Transaksi Terbaru</Text>
          </View>
          <View style={s.txCard}>
            {recent.length === 0 && (
              <Text style={{ color: colors.textSecondary, padding: spacing.md }}>Belum ada transaksi.</Text>
            )}
            {recent.map((e, i) => (
              <View key={e.id} style={[s.txRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[s.txDot, { backgroundColor: e.direction === "CREDIT" ? "#16A34A" : "#F97316" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.txDesc} numberOfLines={1}>{tidyDescription(e.description ?? e.ref_type)}</Text>
                  <Text style={s.txTime}>{timeAgo(e.created_at)}</Text>
                </View>
                <Text style={[s.txAmt, { color: e.direction === "CREDIT" ? "#16A34A" : colors.textPrimary }]}>
                  {e.direction === "CREDIT" ? "+" : "-"}{formatMoney(Number(e.amount), e.currency, true)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
  greeting: { color: "#94A3B8", fontSize: 13 },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  bellWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  bellBadge: {
    position: "absolute", top: 7, right: 7,
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444",
  },
  saldoLabel: { color: "#94A3B8", fontSize: 13, marginBottom: 2 },
  saldoValue: { color: "#fff", fontSize: 32, fontWeight: "800" },
  growthBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#DCFCE7", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: "flex-start", marginTop: spacing.sm,
  },
  growthText: { color: "#16A34A", fontSize: 12, fontWeight: "600" },
  statsRow: {
    flexDirection: "row", marginTop: spacing.md,
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: spacing.sm,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },
  statLabel: { color: "#94A3B8", fontSize: 11 },
  statVal: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Body
  body: { paddingBottom: 32 },

  sectionRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  sectionLink: { fontSize: 13, color: colors.accent, fontWeight: "600" },

  walletCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, width: 156,
    borderWidth: 1, borderColor: colors.border,
  },
  walletCardTop: { gap: 6, marginBottom: spacing.xs },
  flagEmoji: { fontSize: 18 },
  walletCcy: { fontWeight: "800", color: colors.textPrimary, fontSize: 14 },
  chgPill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: "#E0F2FE", alignSelf: "flex-start" },
  chgText: { fontSize: 11, fontWeight: "700", color: colors.accent },
  walletBal: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },

  txCard: {
    marginHorizontal: spacing.lg, backgroundColor: colors.card,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  txRow: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  txDot: { width: 10, height: 10, borderRadius: 5 },
  txDesc: { fontWeight: "600", color: colors.textPrimary, fontSize: 14 },
  txTime: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  txAmt: { fontWeight: "700", fontSize: 15, marginLeft: spacing.sm, maxWidth: 112, textAlign: "right" },
});
