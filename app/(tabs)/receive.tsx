import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, Share, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FraudResult, PaymentApi, RiskLevel } from "@/api/endpoints";
import { colors, radius, spacing } from "@/theme/colors";

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: colors.success,
  MEDIUM: colors.warning,
  HIGH: colors.danger,
};

const CCYS = ["USD", "SGD", "EUR", "MYR"];
const SYMBOLS: Record<string, string> = { USD: "$", SGD: "S$", EUR: "€", MYR: "RM" };
const IDR_RATES: Record<string, number> = { USD: 15850, SGD: 12050, EUR: 17200, MYR: 3450 };
const FEE_RATE = 0.005; // 0.5%

interface LinkData { code: string; url: string }

export default function Receive() {
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("500");
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [linkConsumed, setLinkConsumed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fraud, setFraud] = useState<FraudResult | null>(null);
  const [paying, setPaying] = useState(false);

  const sym = SYMBOLS[currency] ?? "";
  const amt = Number(amount) || 0;
  const fee = +(amt * FEE_RATE).toFixed(2);
  const net = +(amt - fee).toFixed(2);
  const idrEquiv = Math.round(net * (IDR_RATES[currency] ?? 0));
  const displayUrl = linkData
    ? `pay.nusawallet.id/p/andi/${currency.toLowerCase()}/${amt}`
    : null;

  async function generate() {
    if (amt <= 0) return Alert.alert("Jumlah tidak valid", "Masukkan jumlah yang benar.");
    setLoading(true);
    setFraud(null);
    setNotice(null);
    try {
      const { data } = await PaymentApi.create(currency, amt);
      setLinkData({ code: data.code, url: data.url });
      setLinkConsumed(false);
      setNotice("Link pembayaran berhasil dibuat dan siap dibagikan.");
    } catch (e: any) {
      Alert.alert("Gagal", e?.response?.data?.detail ?? "Tidak dapat membuat link.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!displayUrl) return;
    await Clipboard.setStringAsync(`https://${displayUrl}`);
    Alert.alert("Disalin", "Link pembayaran disalin ke clipboard.");
  }

  async function share() {
    if (!displayUrl) return;
    await Share.share({ message: `Bayar saya via NusaWallet: https://${displayUrl}` });
  }

  // Sandbox demo: simulate an incoming payment so the fraud engine's result is visible.
  async function simulatePayment(scenario: "normal" | "suspicious") {
    if (!linkData) return;
    setPaying(true);
    setFraud(null);
    setNotice(null);
    const payerName = scenario === "normal" ? "Andi Wijaya" : "";
    const originCountry = scenario === "normal" ? "SG" : "KP";
    try {
      let activeLink = linkData;
      if (linkConsumed) {
        const { data: freshLink } = await PaymentApi.create(
          currency,
          amt,
          `Sandbox AI: ${scenario}`,
        );
        activeLink = { code: freshLink.code, url: freshLink.url };
        setLinkData(activeLink);
        setNotice("Link sandbox baru dibuat otomatis untuk skenario berikutnya.");
      }

      const { data } = await PaymentApi.pay(activeLink.code, payerName, originCountry);
      setFraud(data);
      setLinkConsumed(true);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (detail && typeof detail === "object") {
        setFraud(detail as FraudResult); // held for review (402 REVIEW_REQUIRED)
        setLinkConsumed(true);
      } else {
        Alert.alert("Gagal", "Simulasi pembayaran gagal. Buat link baru lalu coba lagi.");
      }
    } finally {
      setPaying(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={s.header}>
            <View style={{ width: 24 }} />
            <Text style={s.headerTitle}>Terima Pembayaran</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Input card */}
          <View style={s.card}>
            <Text style={s.label}>Mata Uang</Text>
            <View style={s.ccyRow}>
              {CCYS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setCurrency(c);
                    setLinkData(null);
                    setLinkConsumed(false);
                    setNotice(null);
                  }}
                  style={[s.chip, currency === c && s.chipActive]}
                >
                  <Text style={[s.chipText, currency === c && s.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.label, { marginTop: spacing.md }]}>Jumlah</Text>
            <TextInput
              style={s.amtInput}
              value={amount}
              onChangeText={(v) => {
                setAmount(v);
                setLinkData(null);
                setLinkConsumed(false);
                setNotice(null);
              }}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Fee breakdown card */}
          {amt > 0 && (
            <View style={[s.card, { gap: 10 }]}>
              <Row label="Jumlah" value={`${currency} ${amt.toFixed(2)}`} />
              <Row label="Biaya" value={`-${sym}${fee.toFixed(2)}`} valueColor="#F59E0B" />
              <View style={s.divider} />
              <View style={s.receivedRow}>
                <Text style={s.receivedLabel}>Diterima</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.receivedValue}>{`${currency} ${net.toFixed(2)}`}</Text>
                  {idrEquiv > 0 && (
                    <Text style={s.idrEquiv}>≈ Rp {idrEquiv.toLocaleString("id-ID")}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Generate button */}
          <TouchableOpacity style={s.btnPrimary} onPress={generate} disabled={loading}>
            <Text style={s.btnPrimaryText}>
              {loading ? "Membuat..." : "Buat Link Pembayaran"}
            </Text>
          </TouchableOpacity>

          {notice && (
            <View style={s.successNotice} accessibilityRole="alert">
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={s.successNoticeText}>{notice}</Text>
            </View>
          )}

          {/* Link result card */}
          {linkData && displayUrl && (
            <View style={[s.card, { gap: spacing.sm }]}>
              <Text style={s.label}>Link Pembayaran</Text>
              <View style={s.linkBox}>
                <Ionicons name="link-outline" size={16} color={colors.textSecondary} />
                <Text style={s.linkText} numberOfLines={1}>{displayUrl}</Text>
              </View>
              <View style={s.btnRow}>
                <TouchableOpacity style={[s.actionBtn, { flex: 1 }]} onPress={copy}>
                  <Ionicons name="copy-outline" size={16} color="#fff" />
                  <Text style={s.actionBtnText}>Salin Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, s.actionBtnOutline, { flex: 1 }]} onPress={share}>
                  <Ionicons name="share-outline" size={16} color={colors.primary} />
                  <Text style={[s.actionBtnText, { color: colors.primary }]}>Bagikan</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Fraud detection demo (sandbox) */}
          {linkData && (
            <View style={[s.card, { gap: spacing.sm }]}>
              <Text style={s.label}>Uji Deteksi Fraud (demo sandbox)</Text>
              <Text style={s.sandboxHint}>
                Setiap skenario memakai link sekali pakai. Link baru dibuat otomatis saat diperlukan.
              </Text>
              <View style={s.btnRow}>
                <TouchableOpacity
                  style={[s.actionBtn, s.actionBtnOutline, { flex: 1 }]}
                  onPress={() => simulatePayment("normal")}
                  disabled={paying}
                >
                  <Text style={[s.actionBtnText, { color: colors.primary }]}>Pembayaran Normal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, s.actionBtnOutline, { flex: 1 }]}
                  onPress={() => simulatePayment("suspicious")}
                  disabled={paying}
                >
                  <Text style={[s.actionBtnText, { color: colors.danger }]}>Mencurigakan</Text>
                </TouchableOpacity>
              </View>

              {fraud && (
                <View style={s.fraudResult}>
                  <View style={s.fraudHeader}>
                    <Ionicons
                      name={fraud.status === "REVIEW_REQUIRED" ? "warning" : "shield-checkmark"}
                      size={18}
                      color={RISK_COLOR[fraud.risk_level ?? "LOW"]}
                    />
                    <Text style={s.fraudTitle}>
                      {fraud.status === "REVIEW_REQUIRED"
                        ? "Ditahan untuk ditinjau"
                        : "Pembayaran diterima"}
                    </Text>
                    <View style={[s.riskBadge, { backgroundColor: RISK_COLOR[fraud.risk_level ?? "LOW"] }]}>
                      <Text style={s.riskBadgeText}>Risiko {fraud.risk_level ?? "LOW"}</Text>
                    </View>
                  </View>
                  {(fraud.factors ?? []).slice(0, 4).map((f, i) => (
                    <View key={i} style={s.factorRow}>
                      <View style={s.factorDot} />
                      <Text style={s.factorText}>{f}</Text>
                    </View>
                  ))}
                  <Text style={s.fraudNote}>
                    Skor risiko dihitung server-side. Ini simulasi sandbox — bukan transaksi nyata.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: valueColor ?? colors.textPrimary, fontWeight: "600", fontSize: 14 }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, fontWeight: "500" },
  ccyRow: { flexDirection: "row", gap: spacing.sm },
  chip: {
    flex: 1, height: 40, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontWeight: "600", fontSize: 14 },
  chipTextActive: { color: "#fff" },
  amtInput: {
    fontSize: 28, fontWeight: "700", color: colors.textPrimary,
    borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8,
  },
  divider: { height: 1, backgroundColor: colors.border },
  receivedRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  receivedLabel: { fontSize: 14, color: colors.textSecondary },
  receivedValue: { fontSize: 18, fontWeight: "800", color: "#16A34A" },
  idrEquiv: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  btnPrimary: {
    backgroundColor: colors.primary, height: 52,
    borderRadius: radius.md, alignItems: "center", justifyContent: "center",
  },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  successNotice: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0",
    borderRadius: radius.md, padding: spacing.md,
  },
  successNoticeText: { flex: 1, color: "#166534", fontSize: 13, lineHeight: 18 },
  linkBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.background, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  linkText: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  btnRow: { flexDirection: "row", gap: spacing.sm },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, height: 44, borderRadius: radius.md, backgroundColor: colors.primary,
  },
  actionBtnOutline: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  fraudResult: {
    backgroundColor: colors.background, borderRadius: radius.md,
    padding: spacing.md, gap: spacing.sm,
  },
  sandboxHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  fraudHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  fraudTitle: { flex: 1, fontWeight: "700", color: colors.textPrimary, fontSize: 14 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  riskBadgeText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  factorRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  factorDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.danger, marginTop: 6 },
  factorText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  fraudNote: { color: colors.textSecondary, fontSize: 11, fontStyle: "italic", marginTop: 2 },
});
