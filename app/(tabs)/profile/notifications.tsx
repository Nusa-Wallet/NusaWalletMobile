import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { SubScreenHeader } from "@/components/SubScreenHeader";
import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
import { scale } from "@/utils/responsive";
import AnimatedPressable from "@/components/AnimatedPressable";

const NOTIF_ITEMS = [
  { icon: "swap-horizontal-outline", title: "Konversi Valas", sub: "Saat kurs mencapai target Anda", key: "conversion" },
  { icon: "arrow-down-outline", title: "Pembayaran Masuk", sub: "Dana diterima di dompet Anda", key: "payment" },
  { icon: "warning-outline", title: "Peringatan Fraud", sub: "Aktivitas mencurigakan terdeteksi", key: "fraud" },
  { icon: "trending-up-outline", title: "Insights Mingguan", sub: "Rekomendasi AI dan laporan pasar", key: "insights" },
  { icon: "megaphone-outline", title: "Promo & Update", sub: "Fitur baru dan penawaran spesial", key: "promo" },
];

export default function Notifications() {
  const { width: screenWidth } = useWindowDimensions();
  const iconSize = scale(36, screenWidth);
  const [settings, setSettings] = useState({
    push: true,
    email: true,
    conversion: true,
    payment: true,
    fraud: true,
    insights: false,
    promo: false,
  });

  function toggle(key: string) {
    setSettings((prev) => ({ ...prev, [key]: !(prev as any)[key] }));
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <SubScreenHeader title="Notifikasi" />
      <ScrollView contentContainerStyle={s.scroll}>
        <StaggerFadeIn index={0}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>SALURAN</Text>
            <View style={s.card}>
              <View style={s.row}>
                <View style={s.rowIcon}>
                  <Ionicons name="notifications-outline" size={20} color={colors.accent} />
                </View>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Push Notification</Text>
                  <Text style={s.rowSub}>Notifikasi langsung di perangkat</Text>
                </View>
                <Switch value={settings.push} onValueChange={() => toggle("push")} trackColor={{ false: colors.border, true: colors.accent }} />
              </View>
              <View style={s.divider} />
              <View style={s.row}>
                <View style={s.rowIcon}>
                  <Ionicons name="mail-outline" size={20} color={colors.accent} />
                </View>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Email</Text>
                  <Text style={s.rowSub}>Notifikasi via email</Text>
                </View>
                <Switch value={settings.email} onValueChange={() => toggle("email")} trackColor={{ false: colors.border, true: colors.accent }} />
              </View>
            </View>
          </View>
        </StaggerFadeIn>

        <StaggerFadeIn index={1}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>JENIS NOTIFIKASI</Text>
            <View style={s.card}>
              {NOTIF_ITEMS.map((item, i) => (
                <View key={item.key}>
                  {i > 0 && <View style={s.divider} />}
                  <View style={s.row}>
                    <View style={s.rowIcon}>
                      <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} />
                    </View>
                    <View style={s.rowContent}>
                      <Text style={s.rowTitle}>{item.title}</Text>
                      <Text style={s.rowSub}>{item.sub}</Text>
                    </View>
                    <Switch
                      value={(settings as any)[item.key]}
                      onValueChange={() => toggle(item.key)}
                      trackColor={{ false: colors.border, true: colors.accent }}
                    />
                  </View>
                </View>
              ))}
            </View>
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
});
