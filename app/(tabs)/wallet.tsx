import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, RefreshControl, ScrollView, StyleSheet, Text,
  useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LedgerEntry, WalletApi, WalletBalance } from "@/api/endpoints";
import { Card } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { ErrorView } from "@/components/ErrorView";
import { MiniChart } from "@/components/MiniChart";
import { Skeleton, SkeletonCard, SkeletonTxRow } from "@/components/Skeleton";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
import { formatMoney, formatRate, timeAgo, tidyDescription } from "@/utils/format";
import { scale, scaleFont } from "@/utils/responsive";
import { FLAGS, FX_TARGETS } from "@/constants";
import AnimatedPressable from "@/components/AnimatedPressable";

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const FALLBACK_RATES: Record<string, number> = {
  IDR: 1, USD: 15850, SGD: 12050, EUR: 17200, MYR: 3450,
};
const HISTORY_PAGE_SIZE = 10;

const QUICK_ACTIONS = [
  { icon: "arrow-up-outline", label: "Kirim", color: colors.primary, action: "send" },
  { icon: "arrow-down-outline", label: "Top Up", color: colors.accent, action: "topup" },
  { icon: "swap-horizontal-outline", label: "Tukar", color: "#1E3A6E", action: "convert" },
] as const;

function buildRateTrend(rate: number) {
  if (rate <= 1) return [1, 1, 1, 1, 1, 1, 1];
  return [0.986, 0.992, 0.989, 0.997, 1.001, 1.006, 1].map((scale) =>
    Math.round(rate * scale),
  );
}

export default function WalletScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [active, setActive] = useState("USD");
  const [target, setTarget] = useState("IDR");
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(HISTORY_PAGE_SIZE);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [walletRes, histRes, rateRes] = await Promise.all([
        WalletApi.list(),
        WalletApi.history(active),
        WalletApi.rates(),
      ]);
      setWallets(walletRes.data);
      setHistory(histRes.data);
      setRates(rateRes.data);
      if (walletRes.data.length > 0 && !walletRes.data.find((w) => w.currency === active)) {
        setActive(walletRes.data[0].currency);
      }
    } catch {
      setError("Gagal memuat data dompet.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [active]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const current = wallets.find((w) => w.currency === active);
  const balance = Number(current?.balance ?? 0);
  const chartW = Math.max(0, screenWidth - spacing.lg * 2 - spacing.md * 2 - 2);
  const balIconSize = scale(48, screenWidth);
  const amtFont = scaleFont(26, screenWidth);
  const quickIconSize = scale(40, screenWidth);
  const targetOptions = useMemo(
    () => (active === "IDR" ? FX_TARGETS : ["IDR"]),
    [active],
  );
  const visibleHistory = useMemo(
    () => history.slice(0, visibleHistoryCount),
    [history, visibleHistoryCount],
  );
  const remainingHistoryCount = Math.max(0, history.length - visibleHistoryCount);

  useEffect(() => {
    setTarget(active === "IDR" ? "USD" : "IDR");
    setVisibleHistoryCount(HISTORY_PAGE_SIZE);
  }, [active]);

  const rate = rates[active] ?? FALLBACK_RATES[active] ?? 0;
  const targetRate = rates[target] ?? FALLBACK_RATES[target] ?? 0;
  const targetRateLabel = active === "IDR"
    ? `1 ${target} = Rp ${formatRate(targetRate)}`
    : `1 ${active} = Rp ${formatRate(rate)}`;

  const idrEquivalent = active !== "IDR" ? balance * rate : balance;

  async function handleConvert() {
    if (balance <= 0) return Alert.alert("Saldo kosong", "Tidak ada saldo untuk dikonversi.");
    if (active === target) return Alert.alert("Tujuan tidak valid", "Pilih mata uang tujuan yang berbeda.");
    setConverting(true);
    try {
      const { data } = await WalletApi.convert(active, target, balance);
      Alert.alert(
        "Konversi berhasil",
        `+${target} ${Number(data.amount_out).toLocaleString("en-US")}\nBiaya: ${target} ${Number(data.fee).toLocaleString("en-US")}`,
      );
      load();
    } catch (e: any) {
      Alert.alert("Gagal", e?.response?.data?.detail ?? "Konversi gagal.");
    } finally {
      setConverting(false);
    }
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={[s.header, { justifyContent: "center" }]}>
          <Skeleton width={100} height={18} />
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width={80} height={38} borderRadius={12} />)}
          </View>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  if (error && wallets.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <ErrorView message={error} onRetry={() => load()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
      >
        {/* Header */}
        <StaggerFadeIn index={0}>
          <View style={s.header}>
            <View style={s.decoCircle1} />
            <View style={s.decoCircle2} />
            <Text style={s.headerTitle}>Dompet</Text>
            <Text style={s.headerSub}>Multi-currency wallet</Text>
          </View>
        </StaggerFadeIn>

        {/* Currency tabs */}
        {wallets.length > 0 && (
          <StaggerFadeIn index={1}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tabs}
            >
              {wallets.map((w) => (
                <AnimatedPressable
                  key={w.currency}
                  onPress={() => setActive(w.currency)}
                >
                  <View style={[s.tab, active === w.currency && s.tabActive]}>
                    <Text style={s.tabFlag}>{FLAGS[w.currency]}</Text>
                    <Text style={[s.tabText, active === w.currency && s.tabTextActive]}>
                      {w.currency}
                    </Text>
                  </View>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </StaggerFadeIn>
        )}

        {/* Balance card */}
        <StaggerFadeIn index={2}>
          <View style={s.balanceCard}>
            <View style={s.balanceCardBg} />
            <View style={s.balanceTop}>
              <View style={[s.balanceIcon, { width: balIconSize, height: balIconSize }]}>
                <Text style={{ fontSize: balIconSize * 0.58 }}>{FLAGS[active]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.balanceCcy}>{active}</Text>
                <Text style={s.balanceRate}>{targetRateLabel}</Text>
              </View>
              <AnimatedPressable onPress={() => router.push("/(tabs)/insights")}>
                <View style={s.insightBadge}>
                  <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
                  <Text style={s.insightBadgeText}>AI</Text>
                </View>
              </AnimatedPressable>
            </View>

            <View style={s.balanceAmounts}>
              <View>
                <Text style={s.amtLabel}>Tersedia</Text>
                <Text style={[s.amtValue, { fontSize: amtFont }]}>{formatMoney(balance, active, true)}</Text>
                {active !== "IDR" && idrEquivalent > 0 && (
                  <Text style={s.amtIdr}>≈ Rp {Math.round(idrEquivalent).toLocaleString("id-ID")}</Text>
                )}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.amtLabel}>Pending</Text>
                <Text style={[s.amtValue, { color: colors.warning }]}>-</Text>
              </View>
            </View>

            {/* Quick actions */}
            <View style={s.quickRow}>
              {QUICK_ACTIONS.map((action) => (
                <AnimatedPressable
                  key={action.label}
                  onPress={() => {
                    if (action.action === "convert") handleConvert();
                    else if (action.action === "topup") router.push("/(tabs)/receive");
                    else Alert.alert("Kirim", "Fitur kirim akan segera hadir!");
                  }}
                  style={s.quickBtn}
                >
                  <View style={[s.quickIcon, { width: quickIconSize, height: quickIconSize, backgroundColor: action.color + "20" }]}>
                    <Ionicons name={action.icon as any} size={quickIconSize * 0.45} color={action.color} />
                  </View>
                  <Text style={s.quickLabel}>{action.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>
        </StaggerFadeIn>

        {/* Convert section */}
        <StaggerFadeIn index={3}>
          <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
            <Text style={s.convertSectionTitle}>Konversi Mata Uang</Text>
            <Text style={s.amtLabel}>Tujuan</Text>
            <View style={s.targetRow}>
              {targetOptions.map((ccy) => (
                <AnimatedPressable
                  key={ccy}
                  onPress={() => setTarget(ccy)}
                >
                  <View style={[s.targetChip, target === ccy && s.targetChipActive]}>
                    <Text style={s.targetFlag}>{FLAGS[ccy]}</Text>
                    <Text style={[s.targetText, target === ccy && s.targetTextActive]}>
                      {ccy}
                    </Text>
                  </View>
                </AnimatedPressable>
              ))}
            </View>
            <AnimatedPressable
              style={[s.convertBtn, converting && { opacity: 0.65 }]}
              onPress={handleConvert}
              disabled={converting}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
              <Text style={s.convertBtnText}>
                {converting ? "Memproses..." : `Konversi ke ${target}`}
              </Text>
            </AnimatedPressable>
          </Card>
        </StaggerFadeIn>

        {/* Trend chart */}
        {active !== "IDR" && (
          <StaggerFadeIn index={4}>
            <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
              <View style={s.chartHeader}>
                <Ionicons name="trending-up-outline" size={16} color={colors.accent} />
                <Text style={s.sectionTitle}>Tren Kurs 7 Hari</Text>
              </View>
              <MiniChart
                data={buildRateTrend(rate)}
                color={colors.accent}
                width={chartW}
                height={80}
              />
              <View style={s.dayLabels}>
                {DAYS.map((d, i) => (
                  <Text key={i} style={s.dayLabel}>{d}</Text>
                ))}
              </View>
            </Card>
          </StaggerFadeIn>
        )}

        {/* Riwayat */}
        <StaggerFadeIn index={5}>
          <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
            <View style={s.historyHeader}>
              <Ionicons name="receipt-outline" size={16} color={colors.textSecondary} />
              <Text style={s.sectionTitle}>Riwayat Transaksi</Text>
            </View>
            {history.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title="Belum ada transaksi"
                description={`Riwayat transaksi ${active} akan muncul di sini.`}
              />
            ) : (
              <>
                {visibleHistory.map((e, i) => (
                  <View
                    key={e.id}
                    style={[s.txRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}
                  >
                    <View style={[s.txDot, { backgroundColor: e.direction === "CREDIT" ? colors.success : colors.warning }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.txDesc} numberOfLines={1}>{tidyDescription(e.description ?? e.ref_type)}</Text>
                      <Text style={s.txTime}>{timeAgo(e.created_at)}</Text>
                    </View>
                    <Text style={[s.txAmt, { color: e.direction === "CREDIT" ? colors.success : colors.label }]}>
                      {e.direction === "CREDIT" ? "+" : "-"}{formatMoney(Number(e.amount), e.currency, true)}
                    </Text>
                  </View>
                ))}
                {remainingHistoryCount > 0 && (
                  <AnimatedPressable onPress={() => setVisibleHistoryCount((count) => count + HISTORY_PAGE_SIZE)}>
                    <View style={s.loadMoreButton}>
                      <Text style={s.loadMoreText}>
                        Muat lebih ({remainingHistoryCount} tersisa)
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={colors.accent} />
                    </View>
                  </AnimatedPressable>
                )}
              </>
            )}
          </Card>
        </StaggerFadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.lg,
    paddingTop: spacing.md, paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl,
    overflow: "hidden",
  },
  decoCircle1: {
    position: "absolute", top: -30, right: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  decoCircle2: {
    position: "absolute", bottom: -15, right: 60,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", textAlign: "center" },
  headerSub: { color: colors.textTertiary, textAlign: "center", marginTop: 2 },

  tabs: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabFlag: { fontSize: 16 },
  tabText: { color: colors.textSecondary, fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#fff" },

  balanceCard: {
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    overflow: "hidden",
  },
  balanceCardBg: {
    position: "absolute", top: -60, right: -60,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: `${colors.accent}08`,
  },
  balanceTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  balanceIcon: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  balanceCcy: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  balanceRate: { color: colors.textSecondary, fontSize: 13, marginTop: 1 },
  insightBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE",
  },
  insightBadgeText: { fontSize: 11, fontWeight: "700", color: colors.accent },

  balanceAmounts: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  amtLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 2 },
  amtValue: { fontSize: 26, fontWeight: "800", color: colors.textPrimary },
  amtIdr: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  quickRow: { flexDirection: "row", gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator, paddingTop: spacing.md },
  quickBtn: { flex: 1, alignItems: "center", gap: 4 },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11, fontWeight: "600", color: colors.textSecondary },

  convertSectionTitle: { fontSize: fontSizes.body, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.md },
  targetRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 8, marginBottom: spacing.md },
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
  convertBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, height: 46, borderRadius: radius.md, backgroundColor: colors.primary,
  },
  convertBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  chartHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, flex: 1 },
  dayLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  dayLabel: { color: colors.textSecondary, fontSize: 11, textAlign: "center" },

  historyHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
  txRow: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.md, paddingVertical: 12,
  },
  txDot: { width: 10, height: 10, borderRadius: 5 },
  txDesc: { fontWeight: "600", color: colors.textPrimary, fontSize: 14 },
  txTime: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  txAmt: { fontWeight: "700", fontSize: 15 },
  loadMoreButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator,
  },
  loadMoreText: { color: colors.accent, fontSize: 13, fontWeight: "700" },
});
