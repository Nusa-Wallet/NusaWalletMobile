import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { SubScreenHeader } from "@/components/SubScreenHeader";
import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
import { scale } from "@/utils/responsive";
import AnimatedPressable from "@/components/AnimatedPressable";

export default function Security() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const iconSize = scale(36, screenWidth);
  const [twoFactor, setTwoFactor] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <SubScreenHeader title="Keamanan" />
      <ScrollView contentContainerStyle={s.scroll}>
        <StaggerFadeIn index={0}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>OTENTIKASI</Text>
            <View style={s.card}>
              <View style={s.row}>
                <View style={[s.rowIcon, { width: iconSize, height: iconSize }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
                </View>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Autentikasi Dua Faktor</Text>
                  <Text style={s.rowSub}>Lapisan keamanan tambahan via kode OTP</Text>
                </View>
                <Switch value={twoFactor} onValueChange={setTwoFactor} trackColor={{ false: colors.border, true: colors.accent }} />
              </View>
              <View style={s.divider} />
              <View style={s.row}>
                <View style={s.rowIcon}>
                  <Ionicons name="finger-print-outline" size={20} color={colors.accent} />
                </View>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Biometrik</Text>
                  <Text style={s.rowSub}>Gunakan sidik jari atau Face ID untuk login</Text>
                </View>
                <Switch value={biometric} onValueChange={setBiometric} trackColor={{ false: colors.border, true: colors.accent }} />
              </View>
              <View style={s.divider} />
              <View style={s.row}>
                <View style={s.rowIcon}>
                  <Ionicons name="notifications-outline" size={20} color={colors.accent} />
                </View>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Peringatan Login</Text>
                  <Text style={s.rowSub}>Notifikasi saat ada login dari perangkat baru</Text>
                </View>
                <Switch value={loginAlerts} onValueChange={setLoginAlerts} trackColor={{ false: colors.border, true: colors.accent }} />
              </View>
            </View>
          </View>
        </StaggerFadeIn>

        <StaggerFadeIn index={1}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>KATA SANDI</Text>
            <View style={s.card}>
              <AnimatedPressable onPress={() => Alert.alert("Ubah Kata Sandi", "Fitur ubah kata sandi akan segera tersedia.")}>
                <View style={s.row}>
                  <View style={s.rowIcon}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  </View>
                  <View style={s.rowContent}>
                    <Text style={s.rowTitle}>Ubah Kata Sandi</Text>
                    <Text style={s.rowSub}>Terakhir diubah 30 hari lalu</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </AnimatedPressable>
            </View>
          </View>
        </StaggerFadeIn>

        <StaggerFadeIn index={2}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>SESI</Text>
            <View style={s.card}>
              <AnimatedPressable onPress={() => router.push("/(tabs)/profile/devices" as any)}>
                <View style={s.row}>
                  <View style={s.rowIcon}>
                    <Ionicons name="phone-portrait-outline" size={20} color={colors.textSecondary} />
                  </View>
                  <View style={s.rowContent}>
                    <Text style={s.rowTitle}>Kelola Perangkat</Text>
                    <Text style={s.rowSub}>2 perangkat aktif saat ini</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </AnimatedPressable>
              <View style={s.divider} />
              <AnimatedPressable onPress={() => Alert.alert("Keluar dari Semua Perangkat", "Anda akan keluar dari semua perangkat lain. Perangkat saat ini tidak terpengaruh. Lanjutkan?", [
                { text: "Batal", style: "cancel" },
                { text: "Keluar", style: "destructive", onPress: () => {} },
              ])}>
                <View style={s.row}>
                  <View style={s.rowIcon}>
                    <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                  </View>
                  <View style={s.rowContent}>
                    <Text style={[s.rowTitle, { color: colors.danger }]}>Keluar dari Semua Perangkat</Text>
                    <Text style={s.rowSub}>Akhiri sesi di semua perangkat lain</Text>
                  </View>
                </View>
              </AnimatedPressable>
            </View>
          </View>
        </StaggerFadeIn>

        <StaggerFadeIn index={3}>
          <View style={s.securityNote}>
            <Ionicons name="shield-outline" size={16} color={colors.success} />
            <Text style={s.securityNoteText}>Keamanan akun Anda dalam kondisi baik</Text>
          </View>
        </StaggerFadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.label, fontWeight: "600", color: colors.textSecondary, letterSpacing: 0.5, paddingHorizontal: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowTitle: { fontWeight: "600", color: colors.textPrimary, fontSize: fontSizes.bodyAlt },
  rowSub: { color: colors.textSecondary, fontSize: fontSizes.label, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginHorizontal: spacing.md },
  securityNote: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  securityNoteText: { fontSize: fontSizes.caption, color: colors.success, fontWeight: "500" },
});
