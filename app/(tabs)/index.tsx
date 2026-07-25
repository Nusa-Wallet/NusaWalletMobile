import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
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
import { palette, colors, radius, spacing } from "@/theme/colors";
import { formatMoney, formatRate, timeAgo, tidyDescription } from "@/utils/format";
import { cardWidth, scale, scaleFont } from "@/utils/responsive";
import { CCY_COLORS, FLAG_IMAGES, FLAGS } from "@/constants";
import { fonts, fontSizes } from "@/theme/typography";

const QUICK_ACTIONS = [
  { icon: "arrow-down-outline", label: "Terima", color: "#2B7FFF", route: "/(tabs)/receive" },
  { icon: "swap-horizontal-outline", label: "Konversi", color: "#00BC7D", route: "/(tabs)/wallet" },
  { icon: "arrow-up-outline", label: "Kirim", color: "#8E51FF", route: "/(tabs)/wallet" },
  { icon: "time-outline", label: "Riwayat", color: "#FE9A00", route: "/(tabs)/wallet" },
] as const;

function useInsightCards(
  wallets: WalletBalance[], recent: LedgerEntry[],
  rates: Record<string, number>, growthPct: number, totalIdr: number,
) {
  const nonIdr = wallets.filter((w) => w.currency !== "IDR");
  const txCount = recent.length;
  const creditCount = recent.filter((e) => e.direction === "CREDIT").length;
  const debitCount = recent.filter((e) => e.direction === "DEBIT").length;
  const lastTx = recent[0];
  const lastTxAgo = lastTx ? timeAgo(lastTx.created_at) : "-";

  const bestRateCcy = nonIdr.length > 0
    ? nonIdr.reduce((best, w) =>
        (rates[w.currency] ?? 0) > (rates[best.currency] ?? 0) ? w : best
      , nonIdr[0])
    : null;

  const cards: Array<{
    id: string; title: string; sub: string; meta: string;
    gradient: string[]; border: string; titleColor: string; metaColor: string;
  }> = [];

  if (bestRateCcy) {
    const rate = rates[bestRateCcy.currency] ?? 0;
    cards.push({
      id: "fx", title: "AI FX Insight",
      sub: `${bestRateCcy.currency} ${formatMoney(Number(bestRateCcy.balance), bestRateCcy.currency, true)}`,
      meta: `Kurs Rp ${formatRate(rate)}`,
      gradient: ["#EFF6FF", "#EEF2FF"], border: "#DBEAFE",
      titleColor: "#1C398E", metaColor: "#51A2FF",
    });
  }

  if (txCount > 0) {
    cards.push({
      id: "activity", title: "Aktivitas",
      sub: `${creditCount} masuk, ${debitCount} keluar`,
      meta: `Terakhir ${lastTxAgo}`,
      gradient: ["#ECFDF5", "#F0FDF4"], border: "#D0FAE5",
      titleColor: "#004F3B", metaColor: "#00D492",
    });
  }

  if (totalIdr > 0) {
    cards.push({
      id: "growth", title: "Pertumbuhan",
      sub: `${growthPct > 0 ? "+" : ""}${growthPct.toFixed(1)}%`,
      meta: `dari ${wallets.length} dompet`,
      gradient: ["#EFF6FF", "#EEF2FF"], border: "#DBEAFE",
      titleColor: "#1C398E", metaColor: "#51A2FF",
    });
  }

  cards.push({
    id: "wallets", title: "Dompet Aktif",
    sub: `${wallets.length} mata uang`,
    meta: nonIdr.length > 0 ? `${nonIdr.length} asing` : "Rupiah saja",
    gradient: ["#ECFDF5", "#F0FDF4"], border: "#D0FAE5",
    titleColor: "#004F3B", metaColor: "#00D492",
  });

  return cards;
}

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
  const insCardW = (screenWidth - spacing.lg * 2 - spacing.sm) / 2;
  const qIconSize = scale(48, screenWidth);
  const saldoFont = scaleFont(26, screenWidth);
  const nameFont = scaleFont(18, screenWidth);

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

  const idrWallet = wallets.find((w) => w.currency === "IDR");
  const idrBalance = Number(idrWallet?.balance ?? 0);
  const totalIdr = wallets.reduce(
    (sum, w) => sum + Number(w.balance) * (rates[w.currency] ?? 0), 0,
  );
  const incomingThisMonth = recent
    .filter((e) => e.direction === "CREDIT")
    .reduce((sum, e) => sum + Number(e.amount) * (rates[e.currency] ?? 0), 0);
  const pendingAmount = recent
    .filter((e) => e.direction === "DEBIT")
    .reduce((sum, e) => sum + Number(e.amount) * (rates[e.currency] ?? 0), 0);
  const growthPct = totalIdr > 0 && incomingThisMonth > 0
    ? (incomingThisMonth / totalIdr) * 100 : 0;
  const displayName = userName ?? "";
  const insightCards = useInsightCards(wallets, recent, rates, growthPct, totalIdr);

  const miniCards = [
    { icon: "arrow-down-outline", label: "Masuk", val: formatMoney(Math.round(incomingThisMonth / 1_000_000), "IDR", true).replace(/^Rp\s*/, "") + "jt", color: "#00BC7D" },
    { icon: "time-outline", label: "Pending", val: formatMoney(Math.round(pendingAmount / 1_000_000), "IDR", true).replace(/^Rp\s*/, "") + "jt", color: "#FE9A00" },
  ];

  const nonIdr = wallets.filter((w) => w.currency !== "IDR");

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <View style={s.headerTopRow}>
            <View><Skeleton width={100} height={14} /><Skeleton width={140} height={20} style={{ marginTop: 4 }} /></View>
            <Skeleton width={36} height={36} borderRadius={18} />
          </View>
          <Skeleton width={80} height={14} style={{ marginTop: 16 }} />
          <Skeleton width={200} height={32} style={{ marginTop: 6 }} />
          <Skeleton width={130} height={14} style={{ marginTop: 8 }} />
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
        {/* ── Header ── */}
        <StaggerFadeIn index={0}>
          <View style={s.header}>
            <View style={s.headerTopRow}>
              <View>
                <Text style={s.greeting}>Selamat datang,</Text>
                <Text style={[s.name, { fontSize: nameFont }]}>{displayName}</Text>
              </View>
              <AnimatedPressable style={s.bellWrap} onPress={() => setShowNotif(true)}>
                <Ionicons name="notifications-outline" size={18} color="#fff" />
                {unreadCount > 0 && <View style={s.bellDot} />}
              </AnimatedPressable>
            </View>

            <Text style={s.saldoLabel}>Total Saldo</Text>
            <Text style={[s.saldoValue, { fontSize: saldoFont }]}>
              {formatMoney(totalIdr || idrBalance, "IDR")}
            </Text>

            <View style={s.growthRow}>
              <Ionicons name="trending-up-outline" size={12} color="#00D492" />
              <Text style={s.growthText}>
                {growthPct > 0 ? "+" : ""}{growthPct.toFixed(1)}% bulan ini
              </Text>
            </View>

            {/* Mini stat cards */}
            <View style={s.miniRow}>
              {miniCards.map((card) => (
                <View key={card.label} style={s.miniCard}>
                  <Ionicons name={card.icon as any} size={14} color={card.color} />
                  <Text style={s.miniLabel}>{card.label}</Text>
                  <Text style={s.miniVal}>{card.val}</Text>
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
                  <View style={[s.quickActionIcon, { width: qIconSize, height: qIconSize, backgroundColor: action.color }]}>
                    <Ionicons name={action.icon as any} size={qIconSize * 0.46} color="#fff" />
                  </View>
                  <Text style={s.quickActionLabel}>{action.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </StaggerFadeIn>

          {/* ── Dompet Saya ── */}
          <StaggerFadeIn index={2}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Dompet Saya</Text>
              <AnimatedPressable onPress={() => router.push("/(tabs)/wallet")}>
                <Text style={s.sectionLink}>Lihat Semua</Text>
              </AnimatedPressable>
            </View>
          </StaggerFadeIn>

          {nonIdr.length === 0 && !idrWallet ? (
            <StaggerFadeIn index={3}>
              <EmptyState icon="wallet-outline" title="Belum ada dompet" description="Tambahkan mata uang asing untuk mulai bertransaksi." />
            </StaggerFadeIn>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: 4 }}
            >
              {idrWallet && (
                <StaggerFadeIn index={0} baseDelay={50}>
                  <AnimatedPressable onPress={() => router.push("/(tabs)/wallet")}>
                    <View style={[s.walletCard, { width: wCardW }]}>
                      <View style={s.walletCardTop}>
                        <View style={s.walletCardTopInner}>
                          <Image source={FLAG_IMAGES["IDR"]} style={s.flagImg} />
                          <Text style={s.walletCcy}>IDR</Text>
                        </View>
                        <View style={s.chgPill}>
                          <Text style={s.chgText} numberOfLines={1}>Rp {formatRate(rates["IDR"] ?? 1)}</Text>
                        </View>
                      </View>
                      <Text style={s.walletBal} numberOfLines={1}>{formatMoney(idrBalance, "IDR", true)}</Text>
                    </View>
                  </AnimatedPressable>
                </StaggerFadeIn>
              )}
              {nonIdr.map((w, i) => (
                <StaggerFadeIn key={w.currency} index={i + 1} baseDelay={100}>
                  <AnimatedPressable onPress={() => router.push("/(tabs)/wallet")}>
                    <View style={[s.walletCard, { width: wCardW }]}>
                      <View style={s.walletCardTop}>
                        <View style={s.walletCardTopInner}>
                          {FLAG_IMAGES[w.currency] ? (
                            <Image source={FLAG_IMAGES[w.currency]} style={s.flagImg} />
                          ) : (
                            <Text style={s.flagEmoji}>{FLAGS[w.currency] ?? ""}</Text>
                          )}
                          <Text style={s.walletCcy}>{w.currency}</Text>
                        </View>
                        <View style={s.chgPill}>
                          <Text style={s.chgText} numberOfLines={1}>Rp {formatRate(rates[w.currency] ?? 0)}</Text>
                        </View>
                      </View>
                      <Text style={s.walletBal} numberOfLines={1}>{formatMoney(Number(w.balance), w.currency, true)}</Text>
                    </View>
                  </AnimatedPressable>
                </StaggerFadeIn>
              ))}
            </ScrollView>
          )}

          {/* ── Insight Cards ── */}
          <StaggerFadeIn index={nonIdr.length + (idrWallet ? 1 : 0) + 1}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: 4, paddingTop: spacing.sm }}
            >
              {insightCards.map((card) => (
                <AnimatedPressable key={card.id}>
                  <View style={[s.insightCard, { width: insCardW, borderColor: card.border, backgroundColor: card.gradient[0] }]}>
                    <View style={[s.insightIconWrap, { backgroundColor: card.metaColor + "18" }]}>
                      <Ionicons
                        name={card.id === "fx" ? "trending-up-outline" : card.id === "activity" ? "swap-horizontal-outline" : card.id === "growth" ? "bar-chart-outline" : "wallet-outline"}
                        size={18} color={card.titleColor}
                      />
                    </View>
                    <Text style={[s.insightTitle, { color: card.titleColor }]}>{card.title}</Text>
                    <Text style={[s.insightSub, { color: card.metaColor }]}>{card.sub}</Text>
                    <Text style={[s.insightMeta, { color: card.metaColor }]}>{card.meta}</Text>
                  </View>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </StaggerFadeIn>

          {/* ── Transaksi Terbaru ── */}
          <StaggerFadeIn index={nonIdr.length + (idrWallet ? 1 : 0) + 2}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Transaksi Terbaru</Text>
              <AnimatedPressable onPress={() => router.push("/(tabs)/wallet")}>
                <Text style={s.sectionLink}>Semua</Text>
              </AnimatedPressable>
            </View>
          </StaggerFadeIn>

          <StaggerFadeIn index={nonIdr.length + (idrWallet ? 1 : 0) + 3}>
            <View style={s.txCard}>
              {recent.length === 0 ? (
                <EmptyState icon="receipt-outline" title="Belum ada transaksi" description="Transaksi Anda akan muncul di sini." />
              ) : (
                recent.map((e, i) => (
                  <AnimatedPressable key={e.id} style={[s.txRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
                    <View style={[s.txDot, { backgroundColor: e.direction === "CREDIT" ? colors.success : e.direction === "DEBIT" ? colors.label : colors.warning }]} />
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
    backgroundColor: palette.navy50,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: "hidden",
  },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontFamily: fonts.regular, color: "rgba(255,255,255,0.5)", fontSize: fontSizes.caption },
  name: { fontFamily: fonts.semibold, color: "#fff", fontSize: fontSizes.h4 },
  bellWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: "#FB2C36" },
  saldoLabel: { fontFamily: fonts.regular, color: "rgba(255,255,255,0.5)", fontSize: fontSizes.caption, marginTop: spacing.lg, marginBottom: 2 },
  saldoValue: { fontFamily: fonts.bold, color: "#fff", fontSize: fontSizes.h1 },
  growthRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  growthText: { fontFamily: fonts.regular, color: "#00D492", fontSize: fontSizes.caption },
  miniRow: {
    flexDirection: "row", gap: spacing.sm, marginTop: spacing.md,
  },
  miniCard: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, gap: 2,
  },
  miniLabel: { fontFamily: fonts.regular, color: "rgba(255,255,255,0.5)", fontSize: fontSizes.micro },
  miniVal: { fontFamily: fonts.semibold, fontSize: fontSizes.body, color: "#fff" },
  body: { paddingBottom: 32 },
  quickActionRow: { flexDirection: "row", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  quickActionItem: { flex: 1, alignItems: "center", gap: spacing.xs },
  quickActionIcon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1.5 },
  quickActionLabel: { fontFamily: fonts.medium, fontSize: fontSizes.small, color: colors.textSecondary },
  sectionRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: fontSizes.h4, color: colors.textPrimary },
  sectionLink: { fontFamily: fonts.medium, fontSize: fontSizes.small, color: colors.accent },
  walletCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.sm,
    width: 162, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1,
    overflow: "hidden",
  },
  walletCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  walletCardTopInner: { flexDirection: "row", alignItems: "center", gap: 4 },
  flagImg: { width: 18, height: 13, borderRadius: 2 },
  flagEmoji: { fontSize: 14, lineHeight: 18 },
  walletCcy: { fontFamily: fonts.medium, color: colors.textSecondary, fontSize: fontSizes.micro },
  chgPill: { borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: `${colors.accent}15`, flexShrink: 1 },
  chgText: { fontFamily: fonts.medium, fontSize: fontSizes.tiny, color: colors.accent },
  walletBal: { fontFamily: fonts.semibold, fontSize: fontSizes.h6, color: colors.label, flexShrink: 1 },
  insightCard: {
    borderRadius: radius.lg, borderWidth: 1, padding: spacing.md,
    width: 171, gap: 2,
  },
  insightIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  insightTitle: { fontFamily: fonts.semibold, fontSize: fontSizes.caption },
  insightSub: { fontFamily: fonts.medium, fontSize: fontSizes.micro },
  insightMeta: { fontFamily: fonts.medium, fontSize: fontSizes.tiny },
  txCard: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: "hidden" },
  txRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 14 },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txDesc: { fontFamily: fonts.medium, color: colors.textPrimary, fontSize: fontSizes.caption },
  txTime: { fontFamily: fonts.regular, color: colors.textTertiary, fontSize: fontSizes.micro, marginTop: 1 },
  txAmt: { fontFamily: fonts.semibold, fontSize: fontSizes.h6, marginLeft: spacing.sm, maxWidth: 112, textAlign: "right" },
});
