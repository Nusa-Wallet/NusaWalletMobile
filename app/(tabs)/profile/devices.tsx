import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DeviceInfo, ProfileApi } from "@/api/endpoints";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { SubScreenHeader } from "@/components/SubScreenHeader";
import { colors, radius, spacing } from "@/theme/colors";
import { fonts, fontSizes } from "@/theme/typography";
import AnimatedPressable from "@/components/AnimatedPressable";

export default function Devices() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ProfileApi.devices();
      setDevices(data);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function handleRemove(id: number, name: string) {
    Alert.alert("Hapus Perangkat", `Hapus "${name}" dari daftar perangkat terdaftar?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus", style: "destructive", onPress: async () => {
          try {
            await ProfileApi.removeDevice(id);
            setDevices((prev) => prev.filter((d) => d.id !== id));
          } catch {
            Alert.alert("Gagal", "Tidak dapat menghapus perangkat.");
          }
        },
      },
    ]);
  }

  const now = new Date();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <SubScreenHeader title="Perangkat" />
      <ScrollView contentContainerStyle={s.scroll}>
        <StaggerFadeIn index={0}>
          <Text style={s.infoText}>
            Perangkat yang telah masuk ke akun NusaWallet Anda. Jika melihat perangkat yang tidak dikenal, segera ubah kata sandi.
          </Text>
        </StaggerFadeIn>

        <StaggerFadeIn index={1}>
          <View style={s.card}>
            {loading ? (
              <View style={s.emptyWrap}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : devices.length === 0 ? (
              <View style={s.emptyWrap}>
                <Ionicons name="phone-portrait-outline" size={32} color={colors.textTertiary} />
                <Text style={s.emptyText}>Belum ada perangkat terdaftar</Text>
              </View>
            ) : (
              devices.map((d, i) => {
                const isCurrent = d.is_current;
                const lastActiveMs = new Date(d.last_active).getTime();
                const diffMs = now.getTime() - lastActiveMs;
                const lastActiveStr = diffMs < 60000 ? "Sekarang" : diffMs < 3600000 ? `${Math.round(diffMs / 60000)} menit lalu` : `${Math.round(diffMs / 3600000)} jam lalu`;
                return (
                  <View key={d.id}>
                    {i > 0 && <View style={s.divider} />}
                    <View style={s.row}>
                      <View style={s.rowIcon}>
                        <Ionicons name={d.name.includes("iPhone") || d.name.includes("Android") ? "phone-portrait-outline" : "laptop-outline"} size={22} color={isCurrent ? colors.accent : colors.textSecondary} />
                      </View>
                      <View style={s.rowContent}>
                        <View style={s.nameRow}>
                          <Text style={s.deviceName}>{d.name}</Text>
                          {isCurrent && (
                            <View style={s.badge}>
                              <Text style={s.badgeText}>Perangkat ini</Text>
                            </View>
                          )}
                        </View>
                        <Text style={s.deviceSub}>{d.os} · {lastActiveStr}</Text>
                      </View>
                      {!isCurrent && (
                        <AnimatedPressable onPress={() => handleRemove(d.id, d.name)}>
                          <Text style={s.removeText}>Hapus</Text>
                        </AnimatedPressable>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </StaggerFadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width: screenWidth } = { width: 390 };

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  infoText: { fontFamily: fonts.regular, fontSize: fontSizes.caption, color: colors.textSecondary, lineHeight: 19, paddingHorizontal: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  rowIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  deviceName: { fontFamily: fonts.semibold, fontWeight: "600", color: colors.textPrimary, fontSize: fontSizes.bodyAlt },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: `${colors.accent}15` },
  badgeText: { fontFamily: fonts.bold, fontSize: fontSizes.micro, fontWeight: "700", color: colors.accent },
  deviceSub: { fontFamily: fonts.regular, color: colors.textSecondary, fontSize: fontSizes.label, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginHorizontal: spacing.md },
  removeText: { fontFamily: fonts.semibold, color: colors.danger, fontSize: fontSizes.caption, fontWeight: "600" },
  emptyWrap: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { fontFamily: fonts.regular, color: colors.textSecondary, fontSize: fontSizes.caption },
});
