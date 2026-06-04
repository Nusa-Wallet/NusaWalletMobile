import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InsightsApi, LedgerEntry, WalletApi, WalletBalance } from "@/api/endpoints";
import { colors, radius, spacing } from "@/theme/colors";

const FLAGS: Record<string, string> = { IDR: "🇮🇩", USD: "🇺🇸", SGD: "🇸🇬", EUR: "🇪🇺", MYR: "🇲🇾" };
const SYMBOLS: Record<string, string> = { IDR: "Rp", USD: "$", SGD: "S$", EUR: "€", MYR: "RM" };
const MOCK_CHANGE: Record<string, number> = { IDR: 2.1, USD: 0.5, SGD: 1.2, EUR: -0.8, MYR: -0.3 };

const QUICK = [
  { icon: "download-outline", label: "Terima", bg: "#2563EB", tab: "receive" },
  { icon: "swap-horizontal-outline", label: "Konversi", bg: "#16A34A", tab: "wallet" },
  { icon: "send-outline", label: "Kirim", bg: "#7C3AED", tab: null },
  { icon: "time-outline", label: "Riwayat", bg: "#EA580C", tab: "wallet" },
] as const;

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
  const [confidence, setConfidence] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      WalletApi.list().then((r) => setWallets(r.data)).catch(() => {});
      WalletApi.recentTransactions(5).then((r) => setRecent(r.data)).catch(() => {});
      InsightsApi.fxAdvisory("USD", "IDR").then((r) => setConfidence(r.data.confidence)).catch(() => {});
    }, [])
  );

  const idrBalance = Number(wallets.find((w) => w.currency === "IDR")?.balance ?? 0);
  const nonIdr = wallets.filter((w) => w.currency !== "IDR");

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

          <Text style={s.saldoLabel}>Total Saldo</Text>
          <Text style={s.saldoValue}>Rp {idrBalance.toLocaleString("id-ID")}</Text>

          <View style={s.growthBadge}>
            <Ionicons name="trending-up" size={12} color="#16A34A" />
            <Text style={s.growthText}>+8.2% bulan ini</Text>
          </View>

          <View style={s.statsRow}>
            {[
              { icon: "arrow-down-outline", label: "Masuk", val: "12.5M", color: "#94A3B8" },
              { icon: "time-outline", label: "Pending", val: "2.8M", color: "#94A3B8" },
              { icon: "alert-circle-outline", label: "Alert", val: "1", color: "#F87171" },
            ].map((stat, i) => (
              <View key={stat.label} style={{ flexDirection: "row", flex: 1 }}>
                {i > 0 && <View style={s.statDivider} />}
                <View style={s.stat}>
                  <Ionicons name={stat.icon as any} size={13} color={stat.color} />
                  <Text style={s.statLabel}>{stat.label}</Text>
                  <Text style={[s.statVal, { color: i === 2 ? "#F87171" : "#fff" }]}>{stat.val}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={s.body}>
          {/* ── QUICK ACTIONS ─────────────────────────── */}
          <View style={s.quickRow}>
            {QUICK.map((q) => (
              <TouchableOpacity
                key={q.label}
                style={s.quick}
                onPress={() => q.tab && router.push(`/(tabs)/${q.tab}` as any)}
              >
                <View style={[s.quickCircle, { backgroundColor: q.bg }]}>
                  <Ionicons name={q.icon as any} size={22} color="#fff" />
                </View>
                <Text style={s.quickLabel}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── DOMPET SAYA ───────────────────────────── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Dompet Saya</Text>
            <Text style={s.sectionLink}>Lihat Semua</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: 4 }}
          >
            {nonIdr.map((w) => {
              const chg = MOCK_CHANGE[w.currency] ?? 0;
              const positive = chg >= 0;
              return (
                <TouchableOpacity
                  key={w.currency}
                  style={s.walletCard}
                  onPress={() => router.push("/(tabs)/wallet")}
                >
                  <View style={s.walletCardTop}>
                    <Text style={s.flagEmoji}>{FLAGS[w.currency]}</Text>
                    <Text style={s.walletCcy}>{w.currency}</Text>
                    <View style={[s.chgPill, { backgroundColor: positive ? "#DCFCE7" : "#FEE2E2" }]}>
                      <Text style={[s.chgText, { color: positive ? "#16A34A" : "#DC2626" }]}>
                        {positive ? "+" : ""}{chg}%
                      </Text>
                    </View>
                  </View>
                  <Text style={s.walletBal}>
                    {SYMBOLS[w.currency]}{Number(w.balance).toLocaleString("en-US")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── INSIGHT CARDS ─────────────────────────── */}
          <View style={s.insightRow}>
            <View style={[s.insightCard, { borderColor: "#BFDBFE" }]}>
              <View style={[s.insightIconWrap, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="globe-outline" size={18} color={colors.accent} />
              </View>
              <Text style={s.insightTitle}>AI FX Insight</Text>
              <Text style={s.insightSub}>Konversi USD ✓</Text>
              <Text style={[s.insightSub, { color: colors.accent, fontWeight: "600" }]}>
                Confidence: {confidence !== null ? `${(confidence * 100).toFixed(0)}%` : "–"}
              </Text>
            </View>
            <View style={[s.insightCard, { borderColor: "#BBF7D0" }]}>
              <View style={[s.insightIconWrap, { backgroundColor: "#F0FDF4" }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#16A34A" />
              </View>
              <Text style={s.insightTitle}>Keamanan</Text>
              <Text style={s.insightSub}>Semua aman ✓</Text>
              <Text style={[s.insightSub, { color: colors.textSecondary }]}>5 menit lalu</Text>
            </View>
          </View>

          {/* ── TRANSAKSI TERBARU ─────────────────────── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Transaksi Terbaru</Text>
            <Text style={s.sectionLink}>Semua</Text>
          </View>
          <View style={s.txCard}>
            {recent.length === 0 && (
              <Text style={{ color: colors.textSecondary, padding: spacing.md }}>Belum ada transaksi.</Text>
            )}
            {recent.map((e, i) => (
              <View key={e.id} style={[s.txRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
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
  quickRow: {
    flexDirection: "row", justifyContent: "space-around",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
  },
  quick: { alignItems: "center", gap: 6 },
  quickCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },

  sectionRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  sectionLink: { fontSize: 13, color: colors.accent, fontWeight: "600" },

  walletCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, width: 148,
    borderWidth: 1, borderColor: colors.border,
  },
  walletCardTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.xs },
  flagEmoji: { fontSize: 18 },
  walletCcy: { fontWeight: "700", color: colors.textPrimary, flex: 1, fontSize: 13 },
  chgPill: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  chgText: { fontSize: 11, fontWeight: "700" },
  walletBal: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },

  insightRow: {
    flexDirection: "row", gap: spacing.sm,
    paddingHorizontal: spacing.lg, marginVertical: spacing.md,
  },
  insightCard: {
    flex: 1, backgroundColor: colors.card,
    borderRadius: radius.lg, padding: spacing.md, borderWidth: 1.5,
  },
  insightIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.xs,
  },
  insightTitle: { fontWeight: "700", color: colors.textPrimary, fontSize: 13 },
  insightSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },

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
  txAmt: { fontWeight: "700", fontSize: 15 },
});
