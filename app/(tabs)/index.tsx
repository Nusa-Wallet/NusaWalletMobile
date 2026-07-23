import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LedgerEntry, WalletApi, WalletBalance } from "@/api/endpoints";
import AnimatedPressable from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorView } from "@/components/ErrorView";
import { NotificationPanel } from "@/components/NotificationPanel";
import { Skeleton, SkeletonTxRow } from "@/components/Skeleton";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { colors, radius, spacing } from "@/theme/colors";
import { formatMoney, formatRate, timeAgo, tidyDescription } from "@/utils/format";
import { cardWidth, scale, scaleFont } from "@/utils/responsive";
import { CCY_COLORS, FLAGS } from "@/constants";
import { fontSizes } from "@/theme/typography";

const QUICK_ACTIONS = [
  { icon: "arrow-up-outline", label: "Kirim", color: colors.primary, route: "/(tabs)/wallet" },
  { icon: "add-circle-outline", label: "Top Up", color: colors.accent, route: "/(tabs)/receive" },
  { icon: "swap-horizontal-outline", label: "Konversi", color: colors.primary, route: "/(tabs)/wallet" },
  { icon: "stats-chart-outline", label: "Insights", color: colors.accent, route: "/(tabs)/insights" },
] as const;

const SEEN_RATES_KEY = "nusawallet.seen-rates";

export default function Home() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const { userName } = useAuth();
  const { addNotification, unreadCount, refreshFromStorage } = useNotifications();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [recent, setRecent] = useState<LedgerEntry[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({ IDR: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotif, setShowNotif] = useState(false);

  const wCardW = cardWidth(screenWidth, 2.5, spacing.lg, spacing.sm);
  const qIconSize = scale(48, screenWidth);
  const saldoFont = scaleFont(32, screenWidth);
  const nameFont = scaleFont(20, screenWidth);
  const balFont = scaleFont(18, screenWidth);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [walletRes, txRes, rateRes] = await Promise.all([
        WalletApi.list(),
        WalletApi.recentTransactions(5),
        WalletApi.rates(),
      ]);
      setWallets(walletRes.data);
      setRecent(txRes.data);

      if (rateRes.data && Object.keys(rateRes.data).length > 0) {
        const prevRates = await AsyncStorage_getItem(SEEN_RATES_KEY);
        const old = prevRates ? JSON.parse(prevRates) : {};
        for (const [ccy, rate] of Object.entries(rateRes.data) as [string, number][]) {
          if (old[ccy] && old[ccy] !== rate) {
            const change = ((rate - old[ccy]) / old[ccy]) * 100;
            if (Math.abs(change) > 1) {
              addNotification({
                type: "rate_alert",
                title: `Kurs ${ccy} ${change > 0 ? "Naik" : "Turun"}`,
                body: `1 ${ccy} sekarang Rp ${formatRate(rate)} (${change > 0 ? "+" : ""}${change.toFixed(1)}%)`,
                icon: "trending-up-outline",
              });
            }
          }
        }
        await AsyncStorage_setItem(SEEN_RATES_KEY, JSON.stringify(rateRes.data));
      }

      if (txRes.data.length > 0) {
        const lastTx = txRes.data[0];
        const txTime = new Date(lastTx.created_at).getTime();
        if (Date.now() - txTime < 60000) {
          addNotification({
            type: "transaction",
            title: lastTx.direction === "CREDIT" ? "Pembayaran Diterima" : "Transaksi Berhasil",
            body: `${lastTx.direction === "CREDIT" ? "+" : "-"}${formatMoney(Number(lastTx.amount), lastTx.currency, true)} — ${tidyDescription(lastTx.description ?? lastTx.ref_type)}`,
            icon: "swap-horizontal-outline",
          });
        }
      }

      setRates(rateRes.data);
    } catch {
      setError("Gagal memuat data. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addNotification]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const idrBalance = Number(wallets.find((w) => w.currency === "IDR")?.balance ?? 0);
  const nonIdr = wallets.filter((w) => w.currency !== "IDR");
  const totalIdr = wallets.reduce(
    (sum, w) => sum + Number(w.balance) * (rates[w.currency] ?? 0), 0,
  );
  const incomingIdr = recent
    .filter((e) => e.direction === "CREDIT")
    .reduce((sum, e) => sum + Number(e.amount) * (rates[e.currency] ?? 0), 0);
  const activeCurrencyCount = wallets.filter((w) => Number(w.balance) > 0).length;
  const displayName = userName ?? "Pengguna";

  const ccyDistribution = wallets
    .filter((w) => Number(w.balance) > 0)
    .map((w) => ({
      ccy: w.currency,
      value: Number(w.balance) * (rates[w.currency] ?? 0),
      color: CCY_COLORS[w.currency] ?? colors.accent,
    }));
  const distTotal = ccyDistribution.reduce((s, c) => s + c.value, 0) || 1;
  const distBars = ccyDistribution.slice(0, 4);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <View style={s.headerTopRow}>
            <View><Skeleton width={100} height={14} /><Skeleton width={140} height={20} style={{ marginTop: 4 }} /></View>
            <Skeleton width={38} height={38} borderRadius={19} />
          </View>
          <Skeleton width={120} height={14} style={{ marginTop: 16 }} />
          <Skeleton width={200} height={32} style={{ marginTop: 6 }} />
        </View>
        <View style={s.body}>
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md }}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                  <Skeleton width={48} height={48} borderRadius={14} />
                  <Skeleton width={40} height={11} />
                </View>
              ))}
            </View>
          </View>
          <Skeleton width={120} height={16} style={{ marginLeft: spacing.lg, marginTop: 16, marginBottom: 12 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
          >
            {[1, 2, 3].map((i) => (
              <View key={i} style={[s.walletCard, { padding: 12 }]}>
                <Skeleton width={60} height={50} /><Skeleton width={80} height={18} style={{ marginTop: 8 }} />
              </View>
            ))}
          </ScrollView>
          <Skeleton width={140} height={16} style={{ marginLeft: spacing.lg, marginTop: 16, marginBottom: 12 }} />
          <View style={[s.txCard, { padding: spacing.md }]}>
            {[1, 2, 3].map((i) => <SkeletonTxRow key={i} />)}
          </View>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
      >
        {/* ── Header Section ── */}
        <StaggerFadeIn index={0}>
          <View style={s.header}>
            <View style={s.decoCircle1} />
            <View style={s.decoCircle2} />
            <View style={s.headerTopRow}>
              <View>
                <Text style={s.greeting}>Selamat datang,</Text>
                <Text style={[s.name, { fontSize: nameFont }]}>{displayName}</Text>
              </View>
              <AnimatedPressable style={s.bellWrap} onPress={() => setShowNotif(true)}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                {unreadCount > 0 && (
                  <View style={s.bellBadge}>
                    <Text style={s.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                  </View>
                )}
              </AnimatedPressable>
            </View>

            <Text style={s.saldoLabel}>Total Saldo Ekuivalen</Text>
            <Text style={[s.saldoValue, { fontSize: saldoFont }]}>{formatMoney(totalIdr || idrBalance, "IDR")}</Text>

            {distBars.length > 1 && (
              <>
                <View style={s.distRow}>
                  {distBars.map((c) => (
                    <View key={c.ccy} style={[s.distBar, { flex: Math.max(c.value / distTotal, 0.05), backgroundColor: c.color }]} />
                  ))}
                </View>
                <View style={s.distLabels}>
                  {distBars.map((c) => (
                    <View key={c.ccy} style={s.distLabelItem}>
                      <View style={[s.distDot, { backgroundColor: c.color }]} />
                      <Text style={s.distLabelText}>{c.ccy}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={s.statsRow}>
              {[
                { icon: "arrow-down-outline", label: "Pemasukan", val: `${Math.round(incomingIdr / 1_000_000)}jt` },
                { icon: "wallet-outline", label: "Aktif", val: `${activeCurrencyCount}` },
                { icon: "receipt-outline", label: "Transaksi", val: `${recent.length}` },
              ].map((stat, i) => (
                <View key={stat.label} style={{ flexDirection: "row", flex: 1 }}>
                  {i > 0 && <View style={s.statDivider} />}
                  <View style={s.stat}>
                    <Ionicons name={stat.icon as any} size={13} color="#94A3B8" />
                    <Text style={s.statLabel}>{stat.label}</Text>
                    <Text style={s.statVal}>{stat.val}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </StaggerFadeIn>

        <View style={s.body}>
          {/* ── Quick Actions ── */}
          <StaggerFadeIn index={1}>
            <View style={s.quickActionRow}>
              {QUICK_ACTIONS.map((action) => (
                <AnimatedPressable key={action.label} onPress={() => router.push(action.route)} style={s.quickActionItem}>
                  <View style={[s.quickActionIcon, { width: qIconSize, height: qIconSize, backgroundColor: action.color + "15" }]}>
                    <Ionicons name={action.icon as any} size={qIconSize * 0.46} color={action.color} />
                  </View>
                  <Text style={s.quickActionLabel}>{action.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </StaggerFadeIn>

          {/* ── Wallet Section ── */}
          <StaggerFadeIn index={2}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Dompet Saya</Text>
              <AnimatedPressable onPress={() => router.push("/(tabs)/wallet")}>
                <Text style={s.sectionLink}>Lihat Semua</Text>
              </AnimatedPressable>
            </View>
          </StaggerFadeIn>

          {nonIdr.length === 0 ? (
            <StaggerFadeIn index={3}>
              <EmptyState icon="wallet-outline" title="Belum ada dompet valas" description="Tambahkan mata uang asing untuk mulai bertransaksi." />
            </StaggerFadeIn>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: 4 }}
            >
              {nonIdr.map((w, i) => (
                <StaggerFadeIn key={w.currency} index={i} baseDelay={100}>
                  <AnimatedPressable onPress={() => router.push("/(tabs)/wallet")}>
                    <View style={[s.walletCard, { width: wCardW }]}>
                      <View style={s.walletCardTop}>
                        <View style={s.walletCardTopInner}>
                          <Text style={s.flagEmoji}>{FLAGS[w.currency]}</Text>
                          <Text style={s.walletCcy}>{w.currency}</Text>
                        </View>
                        <View style={s.chgPill}>
                          <Text style={s.chgText}>Rp {formatRate(rates[w.currency] ?? 0)}</Text>
                        </View>
                      </View>
                      <Text style={[s.walletBal, { fontSize: balFont }]}>{formatMoney(Number(w.balance), w.currency, true)}</Text>
                    </View>
                  </AnimatedPressable>
                </StaggerFadeIn>
              ))}
            </ScrollView>
          )}

          {/* ── Recent Transactions ── */}
          <StaggerFadeIn index={nonIdr.length + 1}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Transaksi Terbaru</Text>
              <AnimatedPressable onPress={() => router.push("/(tabs)/wallet")}>
                <Text style={s.sectionLink}>Lihat Semua</Text>
              </AnimatedPressable>
            </View>
          </StaggerFadeIn>

          <StaggerFadeIn index={nonIdr.length + 2}>
            <View style={s.txCard}>
              {recent.length === 0 ? (
                <EmptyState icon="receipt-outline" title="Belum ada transaksi" description="Transaksi Anda akan muncul di sini." />
              ) : (
                recent.map((e, i) => (
                  <AnimatedPressable key={e.id} style={[s.txRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
                    <View style={[s.txDot, { backgroundColor: e.direction === "CREDIT" ? colors.success : colors.warning }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.txDesc} numberOfLines={1}>{tidyDescription(e.description ?? e.ref_type)}</Text>
                      <Text style={s.txTime}>{timeAgo(e.created_at)}</Text>
                    </View>
                    <Text style={[s.txAmt, { color: e.direction === "CREDIT" ? colors.success : colors.label }]}>
                      {e.direction === "CREDIT" ? "+" : "-"}{formatMoney(Number(e.amount), e.currency, true)}
                    </Text>
                  </AnimatedPressable>
                ))
              )}
            </View>
          </StaggerFadeIn>
        </View>
      </ScrollView>

      <NotificationPanel visible={showNotif} onClose={() => setShowNotif(false)} />
    </SafeAreaView>
  );
}

function AsyncStorage_getItem(key: string): Promise<string | null> {
  try { return import("@react-native-async-storage/async-storage").then((m) => m.default.getItem(key)); } catch { return Promise.resolve(null); }
}
function AsyncStorage_setItem(key: string, value: string): Promise<void> {
  try { return import("@react-native-async-storage/async-storage").then((m) => m.default.setItem(key, value)); } catch { return Promise.resolve(); }
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm, paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl,
    overflow: "hidden",
  },
  decoCircle1: { position: "absolute", top: -40, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.04)" },
  decoCircle2: { position: "absolute", bottom: -20, right: 40, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.03)" },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
  greeting: { color: colors.textTertiary, fontSize: fontSizes.caption },
  name: { color: "#fff", fontSize: fontSizes.h3, fontWeight: "700" },
  bellWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  bellBadge: {
    position: "absolute", top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.danger, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  saldoLabel: { color: colors.textTertiary, fontSize: fontSizes.caption, marginBottom: 2 },
  saldoValue: { color: "#fff", fontSize: 32, fontWeight: "800" },
  distRow: { flexDirection: "row", gap: 3, marginTop: spacing.sm, height: 4 },
  distBar: { height: 4, borderRadius: 2 },
  distLabels: { flexDirection: "row", gap: spacing.md, marginTop: 6 },
  distLabelItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  distDot: { width: 6, height: 6, borderRadius: 3 },
  distLabelText: { color: colors.textTertiary, fontSize: fontSizes.micro },
  statsRow: {
    flexDirection: "row", marginTop: spacing.md,
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radius.md, padding: spacing.sm,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },
  statLabel: { color: "#94A3B8", fontSize: 11 },
  statVal: { color: "#fff", fontWeight: "700", fontSize: 15 },
  body: { paddingBottom: 32 },
  quickActionRow: { flexDirection: "row", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  quickActionItem: { flex: 1, alignItems: "center", gap: 6 },
  quickActionIcon: { width: 48, height: 48, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontSize: 11, fontWeight: "600", color: colors.textSecondary },
  sectionRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  sectionLink: { fontSize: 13, color: colors.accent, fontWeight: "600" },
  walletCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md,
    width: 162, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  walletCardTop: { gap: spacing.sm, marginBottom: spacing.xs },
  walletCardTopInner: { gap: 6 },
  flagEmoji: { fontSize: 18 },
  walletCcy: { fontWeight: "800", color: colors.textPrimary, fontSize: 14 },
  chgPill: { borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: `${colors.accent}15`, alignSelf: "flex-start" },
  chgText: { fontSize: 11, fontWeight: "700", color: colors.accent },
  walletBal: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  txCard: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: "hidden" },
  txRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 14 },
  txDot: { width: 10, height: 10, borderRadius: 5 },
  txDesc: { fontWeight: "600", color: colors.textPrimary, fontSize: 14 },
  txTime: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  txAmt: { fontWeight: "700", fontSize: 15, marginLeft: spacing.sm, maxWidth: 112, textAlign: "right" },
});
