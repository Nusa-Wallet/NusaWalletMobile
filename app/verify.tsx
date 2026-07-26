import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AnimatedPressable from "@/components/AnimatedPressable";
import { Card } from "@/components/ui";
import { SubScreenHeader } from "@/components/SubScreenHeader";
import { palette, colors, radius, spacing } from "@/theme/colors";
import { fonts, fontSizes } from "@/theme/typography";

const VERIFICATION_METHODS = [
  {
    id: "face",
    title: "Face Verification",
    desc: "Use facial recognition to verify your identity",
    gradient: ["#2B7FFF", "#155DFC"],
    icon: "camera-outline" as const,
  },
  {
    id: "otp",
    title: "OTP Confirmation",
    desc: "Receive a one-time password via SMS",
    gradient: ["#00C950", "#00A63E"],
    icon: "chatbubble-ellipses-outline" as const,
  },
  {
    id: "trusted",
    title: "Trusted Device Verification",
    desc: "Verify using a previously registered device",
    gradient: ["#AD46FF", "#9810FA"],
    icon: "phone-portrait-outline" as const,
  },
  {
    id: "email",
    title: "Email Verification",
    desc: "Receive a verification link via email",
    gradient: ["#FF6900", "#F54900"],
    icon: "mail-outline" as const,
  },
];

export default function VerifyScreen() {
  const router = useRouter();
  const { amount, currency, time, score, level } = useLocalSearchParams<{
    amount?: string;
    currency?: string;
    time?: string;
    score?: string;
    level?: string;
  }>();
  const [selected, setSelected] = useState<string | null>(null);

  const txAmount = amount || "0.00";
  const txCurrency = currency || "USD";
  const txTime = time || "00:00";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <SubScreenHeader title="Verification Required" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
      >
        {/* Alert Card */}
        <View style={s.alertCard}>
          <View style={s.alertRow}>
            <View style={s.alertIconWrap}>
              <Ionicons name="alert-circle" size={20} color="#fff" />
            </View>
            <Text style={s.alertTitle}>Additional Verification Required</Text>
          </View>
          <Text style={s.alertDesc}>
            We detected unusual transaction behavior and need verification to protect your account.
          </Text>
        </View>

        {/* Transaction Summary */}
        <Card style={{ gap: spacing.sm }}>
          <Text style={s.cardTitle}>Transaction Summary</Text>
          <View style={s.summaryBody}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Amount</Text>
              <Text style={s.summaryValue}>{txCurrency} {txAmount}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Risk Score</Text>
              <Text style={s.summaryValue}>{score || "-"}/100</Text>
            </View>
            <View style={s.divider} />
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Risk Level</Text>
              <Text style={[s.summaryValue, { color: level === "HIGH" ? colors.danger : level === "MEDIUM" ? colors.warning : colors.success }]}>
                {level || "-"}
              </Text>
            </View>
            <View style={s.divider} />
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Attempt Time</Text>
              <Text style={s.summaryValue}>{txTime}</Text>
            </View>
          </View>
        </Card>

        {/* AI Note */}
        <Card style={{ gap: spacing.xs, backgroundColor: palette.blue10 }}>
          <View style={s.noteRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={s.noteTitle}>AI Note</Text>
              <Text style={s.noteDesc}>
                This transaction differs significantly from your normal financial behavior.
              </Text>
            </View>
          </View>
        </Card>

        {/* Choose Verification Method */}
        <View>
          <Text style={s.methodsTitle}>Choose Verification Method</Text>
          <View style={{ gap: spacing.sm, paddingTop: spacing.md }}>
            {VERIFICATION_METHODS.map((method) => {
              const isSelected = selected === method.id;
              return (
                <AnimatedPressable
                  key={method.id}
                  onPress={() => setSelected(method.id)}
                  style={[s.methodCard, isSelected && s.methodCardSelected]}
                >
                  <View style={s.methodRow}>
                    <View
                      style={[
                        s.methodIconWrap,
                        { backgroundColor: method.gradient[0] },
                      ]}
                    >
                      <Ionicons name={method.icon} size={20} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.methodTitle}>{method.title}</Text>
                      <Text style={s.methodDesc}>{method.desc}</Text>
                    </View>
                    <View style={[s.radio, isSelected && s.radioSelected]}>
                      {isSelected && <View style={s.radioInner} />}
                    </View>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {/* Buttons */}
        <View style={s.actionRow}>
          <AnimatedPressable
            style={[s.btnVerify, !selected && { opacity: 0.5 }]}
            onPress={() => selected && Alert.alert("Verifikasi", `Verification method: ${selected}`)}
            disabled={!selected}
          >
            <Text style={s.btnVerifyText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Verifikasi</Text>
          </AnimatedPressable>
          <AnimatedPressable style={s.btnCancel} onPress={() => router.back()}>
            <Text style={s.btnCancelText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Batal</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  alertCard: {
    borderRadius: radius.lg, padding: spacing.lg,
    backgroundColor: palette.red10,
  },
  alertRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  alertIconWrap: {
    backgroundColor: colors.danger, borderRadius: 9999, padding: spacing.xs,
  },
  alertTitle: {
    fontFamily: fonts.semibold, fontSize: fontSizes.h6, color: colors.danger,
    flex: 1,
  },
  alertDesc: { fontFamily: fonts.regular, fontSize: fontSizes.body, color: colors.textSecondary, paddingTop: spacing.sm, lineHeight: 20 },

  cardTitle: { fontFamily: fonts.semibold, fontSize: fontSizes.body, color: colors.textPrimary },
  summaryBody: { gap: spacing.xs },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs },
  summaryLabel: { fontFamily: fonts.regular, fontSize: fontSizes.body, color: colors.textSecondary },
  summaryValue: { fontFamily: fonts.semibold, fontSize: fontSizes.h6, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border },

  noteRow: { flexDirection: "row", gap: spacing.xs, alignItems: "flex-start" },
  noteTitle: { fontFamily: fonts.semibold, fontSize: fontSizes.body, color: colors.accent },
  noteDesc: { fontFamily: fonts.regular, fontSize: fontSizes.caption, color: colors.textSecondary, paddingTop: 2, lineHeight: 16 },

  methodsTitle: { fontFamily: fonts.semibold, fontSize: fontSizes.body, color: colors.textPrimary },

  methodCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  methodCardSelected: {
    borderWidth: 1.5, borderColor: colors.accent,
  },
  methodRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  methodIconWrap: {
    width: 48, height: 48, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  methodTitle: { fontFamily: fonts.semibold, fontSize: fontSizes.h6, color: colors.textPrimary },
  methodDesc: { fontFamily: fonts.regular, fontSize: fontSizes.body, color: colors.textSecondary, paddingTop: 2 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.textSecondary,
    alignItems: "center", justifyContent: "center",
  },
  radioSelected: { borderColor: colors.accent },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },

  actionRow: {
    flexDirection: "row", gap: spacing.sm,
  },
  btnVerify: {
    flex: 1, height: 46, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
    paddingHorizontal: spacing.sm, minWidth: 0,
  },
  btnVerifyText: { fontFamily: fonts.bold, fontSize: fontSizes.bodyAlt, color: "#fff", flexShrink: 1 },
  btnCancel: {
    flex: 1, height: 46, borderRadius: radius.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
    paddingHorizontal: spacing.sm, minWidth: 0,
  },
  btnCancelText: { fontFamily: fonts.bold, fontSize: fontSizes.bodyAlt, color: colors.textPrimary, flexShrink: 1 },
});
