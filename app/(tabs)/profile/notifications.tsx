import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NotificationPrefItem, ProfileApi } from "@/api/endpoints";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { SubScreenHeader } from "@/components/SubScreenHeader";
import { colors, radius, spacing } from "@/theme/colors";
import { fonts, fontSizes } from "@/theme/typography";
import AnimatedPressable from "@/components/AnimatedPressable";

const NOTIF_ITEMS = [
  { icon: "swap-horizontal-outline", title: "Konversi Valas", sub: "Saat kurs mencapai target Anda", key: "conversion" },
  { icon: "arrow-down-outline", title: "Pembayaran Masuk", sub: "Dana diterima di dompet Anda", key: "payment" },
  { icon: "warning-outline", title: "Peringatan Fraud", sub: "Aktivitas mencurigakan terdeteksi", key: "fraud" },
  { icon: "trending-up-outline", title: "Insights Mingguan", sub: "Rekomendasi AI dan laporan pasar", key: "insights" },
  { icon: "megaphone-outline", title: "Promo & Update", sub: "Fitur baru dan penawaran spesial", key: "promo" },
];

export default function Notifications() {
  const [prefs, setPrefs] = useState<NotificationPrefItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ProfileApi.notificationPrefs();
      setPrefs(data);
    } catch {
      setPrefs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggle(key: string, field: "push" | "email", current: boolean) {
    setSaving(key);
    const newVal = !current;
    setPrefs((prev) => prev.map((p) => p.key === key ? { ...p, [field]: newVal } : p));
    try {
      await ProfileApi.updateNotificationPref(key, { [field]: newVal });
    } catch {
      setPrefs((prev) => prev.map((p) => p.key === key ? { ...p, [field]: current } : p));
    } finally {
      setSaving(null);
    }
  }

  const pushPref = prefs.find((p) => p.key === "push");
  const emailPref = prefs.find((p) => p.key === "email");

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <SubScreenHeader title="Notifikasi" />
      <ScrollView contentContainerStyle={s.scroll}>
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: spacing.xl }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <>
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
                    <Switch value={pushPref?.push ?? true} onValueChange={() => toggle("push", "push", pushPref?.push ?? true)} trackColor={{ false: colors.border, true: colors.accent }} disabled={saving === "push"} />
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
                    <Switch value={emailPref?.email ?? true} onValueChange={() => toggle("email", "email", emailPref?.email ?? true)} trackColor={{ false: colors.border, true: colors.accent }} disabled={saving === "email"} />
                  </View>
                </View>
              </View>
            </StaggerFadeIn>

            <StaggerFadeIn index={1}>
              <View style={s.section}>
                <Text style={s.sectionTitle}>JENIS NOTIFIKASI</Text>
                <View style={s.card}>
                  {NOTIF_ITEMS.map((item, i) => {
                    const pref = prefs.find((p) => p.key === item.key);
                    const isPushOn = pref?.push ?? true;
                    return (
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
                          <Switch value={isPushOn} onValueChange={() => toggle(item.key, "push", isPushOn)} trackColor={{ false: colors.border, true: colors.accent }} disabled={saving === item.key} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </StaggerFadeIn>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  section: { gap: spacing.sm },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: fontSizes.label, fontWeight: "600", color: colors.textSecondary, letterSpacing: 0.5, paddingHorizontal: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowTitle: { fontFamily: fonts.semibold, fontWeight: "600", color: colors.textPrimary, fontSize: fontSizes.bodyAlt },
  rowSub: { fontFamily: fonts.regular, color: colors.textSecondary, fontSize: fontSizes.label, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginHorizontal: spacing.md },
});
