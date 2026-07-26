import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Image, RefreshControl, ScrollView, StyleSheet, Text,
  useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LedgerEntry, RateHistoryPoint, WalletApi, WalletBalance } from "@/api/endpoints";
import { Card } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import { EmptyState } from "@/components/EmptyState";
import { ErrorView } from "@/components/ErrorView";
import { MiniChart } from "@/components/MiniChart";
import { Skeleton, SkeletonCard, SkeletonTxRow } from "@/components/Skeleton";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { colors, palette, radius, spacing } from "@/theme/colors";
import { fonts, fontSizes } from "@/theme/typography";
import { formatMoney, formatRate, timeAgo, tidyDescription } from "@/utils/format";
import { scale, scaleFont } from "@/utils/responsive";
import { FLAG_IMAGES, FLAGS, FX_TARGETS } from "@/constants";
import AnimatedPressable from "@/components/AnimatedPressable";

const DAYS = ["S", "S", "R", "K", "J", "S", "M"];

export default function WalletScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [active, setActive] = useState("USD");
  const [target, setTarget] = useState("IDR");
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({ IDR: 1 });
  const [rateHistory, setRateHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [walletRes, histRes, rateRes, histRateRes] = await Promise.all([
        WalletApi.list(),
        WalletApi.history(active),
        WalletApi.rates(),
        WalletApi.rateHistory(active).catch(() => null),
      ]);
      setWallets(walletRes.data);
      setHistory(histRes.data);
      setRates(rateRes.data);
      setRateHistory(histRateRes?.data?.data?.map((p: RateHistoryPoint) => p.rate) ?? []);
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
  const chartW = Math.max(0, screenWidth - spacing.lg * 2 - spacing.md * 2 - spacing.md * 2 - 4);
  const targetOptions = useMemo(
    () => (active === "IDR" ? FX_TARGETS : ["IDR"]),
    [active],
  );

  useEffect(() => {
    setTarget(active === "IDR" ? "USD" : "IDR");
  }, [active]);

  const rate = rates[active] ?? 0;
  const targetRate = rates[target] ?? 0;
  const rateLabel = `1 ${active} = Rp ${formatRate(rate)}`;
  const idrEquivalent = active !== "IDR" ? balance * rate : balance;

  async function executeConvert() {
    setShowConfirm(false);
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

  async function handleConvert() {
    if (balance <= 0) return Alert.alert("Saldo kosong", "Tidak ada saldo untuk dikonversi.");
    if (active === target) return Alert.alert("Tujuan tidak valid", "Pilih mata uang tujuan yang berbeda.");
    setShowConfirm(true);
  }

  const confirmDetail = `${active} ${Number(balance).toLocaleString("en-US")} → ${target}`;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <Skeleton width={120} height={28} />
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width={80} height={38} borderRadius={12} />)}
          </View>
          <SkeletonCard />
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
          <Text style={s.headerTitle}>Dompet</Text>
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
                    {FLAG_IMAGES[w.currency] ? (
                      <Image source={FLAG_IMAGES[w.currency]} style={s.tabFlagImg} />
                    ) : (
                      <Text style={s.tabFlag}>{FLAGS[w.currency]}</Text>
                    )}
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
            <View style={s.balanceTop}>
              {FLAG_IMAGES[active] ? (
                <Image source={FLAG_IMAGES[active]} style={s.balanceFlagImg} />
              ) : (
                <Text style={s.balanceFlag}>{FLAGS[active] ?? ""}</Text>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.balanceCcy}>{active}</Text>
                {active !== "IDR" && (
                  <Text style={s.balanceRate}>{rateLabel}</Text>
                )}
              </View>
            </View>

            <View style={s.balanceAmounts}>
              <View style={{ flex: 1 }}>
                <Text style={s.amtLabel}>Tersedia</Text>
                <Text style={s.amtValue}>{formatMoney(balance, active, true)}</Text>
                {active !== "IDR" && idrEquivalent > 0 && (
                  <Text style={s.amtIdr}>≈ Rp {Math.round(idrEquivalent).toLocaleString("id-ID")}</Text>
                )}
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={s.amtLabel}>Pending</Text>
                <Text style={[s.amtValue, { color: palette.amber50 }]}>-</Text>
              </View>
            </View>

            <View style={s.actionRow}>
              <AnimatedPressable style={s.btnPrimary} onPress={handleConvert}>
                <Ionicons name="swap-horizontal-outline" size={14} color="#fff" />
                <Text style={s.btnPrimaryText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Konversi</Text>
              </AnimatedPressable>
              <AnimatedPressable style={s.btnSecondary} onPress={() => router.push({ pathname: "/fraud", params: { currency: active } })}>
                <Ionicons name="shield-outline" size={14} color={palette.navy50} />
                <Text style={s.btnSecondaryText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>AI Fraud</Text>
              </AnimatedPressable>
            </View>
          </View>
        </StaggerFadeIn>

        {/* Trend chart */}
        {active !== "IDR" && (
          <StaggerFadeIn index={3}>
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Tren Kurs Minggu Ini</Text>
              <MiniChart
                data={rateHistory.length > 0 ? rateHistory : [rate]}
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
          </StaggerFadeIn>
        )}

        {/* History */}
        <StaggerFadeIn index={4}>
          <View style={s.historyCard}>
            <Text style={s.historyTitle}>Riwayat</Text>
            {history.length === 0 ? (
              <View style={{ padding: spacing.md }}>
                <EmptyState
                  icon="receipt-outline"
                  title="Belum ada transaksi"
                  description={`Riwayat transaksi ${active} akan muncul di sini.`}
                />
              </View>
            ) : (
              history.slice(0, 3).map((e, i) => (
                <View
                  key={e.id}
                  style={[s.txRow, i < Math.min(history.length, 3) - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}
                >
                  <View style={[s.txDot, { backgroundColor: e.direction === "CREDIT" ? "#00BC7D" : e.direction === "DEBIT" ? palette.slate700 : "#FE9A00" }]} />
                  <Text style={s.txDesc} numberOfLines={1}>{tidyDescription(e.description ?? e.ref_type)}</Text>
                  <Text style={[s.txAmt, { color: e.direction === "CREDIT" ? "#096" : colors.textPrimary }]}>
                    {e.direction === "CREDIT" ? "+" : "-"}{formatMoney(Number(e.amount), e.currency, true)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </StaggerFadeIn>
      </ScrollView>

      <ConfirmModal
        visible={showConfirm}
        title="Konversi Mata Uang"
        message={`Konversi seluruh saldo ${active} ke ${target}?`}
        detail={confirmDetail}
        confirmLabel="Ya, Konversi"
        loading={converting}
        onConfirm={executeConvert}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F4F8" },

  headerTitle: { fontFamily: fonts.bold, fontSize: fontSizes.h2, color: colors.textPrimary, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  tabs: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: palette.navy40, borderColor: palette.navy40 },
  tabFlagImg: { width: 18, height: 13, borderRadius: 2 },
  tabFlag: { fontSize: 16 },
  tabText: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: fontSizes.caption },
  tabTextActive: { color: "#fff" },

  balanceCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    gap: spacing.md,
  },
  balanceTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  balanceFlagImg: { width: 32, height: 24, borderRadius: 3 },
  balanceFlag: { fontSize: 24 },
  balanceCcy: { fontFamily: fonts.semibold, fontSize: fontSizes.h4, color: colors.textPrimary },
  balanceRate: { fontFamily: fonts.regular, color: palette.slate400, fontSize: fontSizes.micro, marginTop: 1 },
  balanceAmounts: { flexDirection: "row" },
  amtLabel: { fontFamily: fonts.regular, color: palette.slate400, fontSize: fontSizes.micro, marginBottom: 2 },
  amtValue: { fontFamily: fonts.bold, fontSize: fontSizes.h5, color: colors.textPrimary },
  amtIdr: { fontFamily: fonts.regular, color: colors.textSecondary, fontSize: fontSizes.small, marginTop: 2 },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  btnPrimary: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, height: 46, borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 8, minWidth: 0,
  },
  btnPrimaryText: { fontFamily: fonts.bold, fontSize: fontSizes.bodyAlt, color: "#fff", flexShrink: 1 },
  btnSecondary: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, height: 46, borderRadius: radius.md,
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary,
    paddingHorizontal: 8, minWidth: 0,
  },
  btnSecondaryText: { fontFamily: fonts.bold, fontSize: fontSizes.bodyAlt, color: colors.primary, flexShrink: 1 },

  chartCard: {
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    gap: spacing.sm,
  },
  chartTitle: { fontFamily: fonts.semibold, fontSize: fontSizes.caption, color: colors.textPrimary },
  dayLabels: { flexDirection: "row", justifyContent: "space-between" },
  dayLabel: { fontFamily: fonts.regular, color: palette.slate400, fontSize: fontSizes.micro },

  historyCard: {
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    overflow: "hidden",
  },
  historyTitle: {
    fontFamily: fonts.semibold, fontSize: fontSizes.caption, color: colors.textPrimary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  txRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txDesc: { fontFamily: fonts.regular, fontSize: fontSizes.caption, color: colors.textPrimary, flex: 1 },
  txAmt: { fontFamily: fonts.semibold, fontSize: fontSizes.caption },
});
