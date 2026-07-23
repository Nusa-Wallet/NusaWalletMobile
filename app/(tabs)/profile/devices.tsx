import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { SubScreenHeader } from "@/components/SubScreenHeader";
import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
import { scale } from "@/utils/responsive";
import AnimatedPressable from "@/components/AnimatedPressable";

interface Device {
  name: string;
  os: string;
  lastActive: string;
  isCurrent: boolean;
  icon: string;
}

const INITIAL_DEVICES: Device[] = [
  { name: "iPhone 15 Pro", os: "iOS 18.2", lastActive: "Sekarang", isCurrent: true, icon: "phone-portrait-outline" },
  { name: "Chrome - Windows", os: "Windows 11", lastActive: "2 jam lalu", isCurrent: false, icon: "laptop-outline" },
];

export default function Devices() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const iconSize = scale(40, screenWidth);
  const [devices, setDevices] = useState(INITIAL_DEVICES);

  function handleRemove(name: string) {
    Alert.alert("Hapus Perangkat", `Hapus "${name}" dari daftar perangkat terdaftar?`, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => setDevices((prev) => prev.filter((d) => d.name !== name)) },
    ]);
  }

  function handleAdd() {
    Alert.alert("Tambah Perangkat", "Buka aplikasi NusaWallet di perangkat baru, lalu masuk menggunakan akun yang sama.", [
      { text: "Tutup", style: "cancel" },
    ]);
  }

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
            {devices.length === 0 ? (
              <View style={s.emptyWrap}>
                <Ionicons name="phone-portrait-outline" size={32} color={colors.textTertiary} />
                <Text style={s.emptyText}>Belum ada perangkat terdaftar</Text>
              </View>
            ) : (
              devices.map((d, i) => (
                <View key={d.name}>
                  {i > 0 && <View style={s.divider} />}
                  <View style={s.row}>
                    <View style={s.rowIcon}>
                      <Ionicons name={d.icon as any} size={22} color={d.isCurrent ? colors.accent : colors.textSecondary} />
                    </View>
                    <View style={s.rowContent}>
                      <View style={s.nameRow}>
                        <Text style={s.deviceName}>{d.name}</Text>
                        {d.isCurrent && (
                          <View style={s.badge}>
                            <Text style={s.badgeText}>Perangkat ini</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.deviceSub}>{d.os} · {d.lastActive}</Text>
                    </View>
                    {!d.isCurrent && (
                      <AnimatedPressable onPress={() => handleRemove(d.name)}>
                        <Text style={s.removeText}>Hapus</Text>
                      </AnimatedPressable>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </StaggerFadeIn>

        <StaggerFadeIn index={2}>
          <AnimatedPressable style={s.addButton} onPress={handleAdd}>
            <Ionicons name="add-outline" size={20} color={colors.accent} />
            <Text style={s.addButtonText}>Tambah Perangkat</Text>
          </AnimatedPressable>
        </StaggerFadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  infoText: { fontSize: fontSizes.caption, color: colors.textSecondary, lineHeight: 19, paddingHorizontal: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  rowIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  deviceName: { fontWeight: "600", color: colors.textPrimary, fontSize: fontSizes.bodyAlt },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: `${colors.accent}15` },
  badgeText: { fontSize: fontSizes.micro, fontWeight: "700", color: colors.accent },
  deviceSub: { color: colors.textSecondary, fontSize: fontSizes.label, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginHorizontal: spacing.md },
  removeText: { color: colors.danger, fontSize: fontSizes.caption, fontWeight: "600" },
  addButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    height: 48, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, borderStyle: "dashed",
    backgroundColor: colors.card,
  },
  addButtonText: { color: colors.accent, fontSize: fontSizes.bodyAlt, fontWeight: "600" },
  emptyWrap: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: fontSizes.caption },
});
