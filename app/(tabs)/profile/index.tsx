import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/components/ui";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing } from "@/theme/colors";
import { scale } from "@/utils/responsive";
import AnimatedPressable from "@/components/AnimatedPressable";

const MENU_GROUPS = [
  {
    title: "Akun",
    items: [
      { icon: "shield-outline", title: "Keamanan", sub: "2FA, kata sandi, verifikasi", route: "/(tabs)/profile/security" },
      { icon: "globe-outline", title: "Mata Uang", sub: "Atur mata uang utama & favorit", route: "/(tabs)/wallet" },
      { icon: "notifications-outline", title: "Notifikasi", sub: "Push, email & pengingat", route: "/(tabs)/profile/notifications" },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      { icon: "phone-portrait-outline", title: "Perangkat", sub: "Kelola perangkat terdaftar", route: "/(tabs)/profile/devices" },
      { icon: "lock-closed-outline", title: "Privasi", sub: "Kebijakan data & izin", route: "/(tabs)/profile/privacy" },
      { icon: "help-circle-outline", title: "Bantuan", sub: "FAQ, dukungan & pusat bantuan", route: "/(tabs)/profile/help" },
    ],
  },
];

const INITIALS = (name: string | null) => {
  if (!name) return "NA";
  return name.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2);
};

export default function Profile() {
  const { width: screenWidth } = useWindowDimensions();
  const { userName, userEmail, logout } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const avatarSize = scale(56, screenWidth);
  const menuIconSize = scale(36, screenWidth);

  const displayName = userName ?? "Andi Rizky";
  const displayEmail = userEmail ?? "demo@nusawallet.id";

  async function handleLogout() {
    setShowLogoutModal(false);
    await logout();
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <StaggerFadeIn index={0}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Profil</Text>
            <AnimatedPressable onPress={() => router.push("/(tabs)/profile/edit-profile" as any)}>
              <View style={styles.editBtn}>
                <Ionicons name="create-outline" size={16} color={colors.accent} />
                <Text style={styles.editText}>Edit</Text>
              </View>
            </AnimatedPressable>
          </View>
        </StaggerFadeIn>

        <StaggerFadeIn index={1}>
          <AnimatedPressable>
            <Card style={styles.profileCard}>
<View style={[styles.avatar, { width: avatarSize, height: avatarSize }]}>
              <Text style={[styles.avatarText, { fontSize: avatarSize * 0.32 }]}>{INITIALS(displayName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.email}>{displayEmail}</Text>
                <View style={styles.tags}>
                  <View style={[styles.tag, { backgroundColor: "#DCFCE7" }]}>
                    <Text style={[styles.tagText, { color: colors.success }]}>Terverifikasi</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: "#E5EDFB" }]}>
                    <Text style={[styles.tagText, { color: colors.accent }]}>Bisnis</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Card>
          </AnimatedPressable>
        </StaggerFadeIn>

        {MENU_GROUPS.map((group, gi) => (
          <StaggerFadeIn key={group.title} index={gi + 2}>
            <View>
              <Text style={styles.menuGroupTitle}>{group.title}</Text>
              <Card style={{ padding: 0 }}>
                {group.items.map((m, i) => (
                  <AnimatedPressable key={m.title} onPress={() => router.push(m.route as any)}>
                    <View style={[styles.menuRow, i < group.items.length - 1 && styles.menuBorder]}>
<View style={[styles.menuIcon, { width: menuIconSize, height: menuIconSize }]}>
                      <Ionicons name={m.icon as any} size={menuIconSize * 0.56} color={colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.menuTitle}>{m.title}</Text>
                        <Text style={styles.menuSub}>{m.sub}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </View>
                  </AnimatedPressable>
                ))}
              </Card>
            </View>
          </StaggerFadeIn>
        ))}

        <StaggerFadeIn index={4}>
          <AnimatedPressable onPress={() => setShowLogoutModal(true)}>
            <View style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutText}>Keluar</Text>
            </View>
          </AnimatedPressable>
        </StaggerFadeIn>

        <StaggerFadeIn index={5}>
          <View style={styles.appInfo}>
            <View style={styles.appInfoLogo}>
              <Ionicons name="wallet" size={16} color={colors.accent} />
            </View>
            <Text style={styles.appInfoName}>NusaWallet v0.1.0</Text>
            <Text style={styles.appInfoDesc}>Multi-currency wallet with AI-powered insights</Text>
          </View>
        </StaggerFadeIn>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLogoutModal(false)}>
          <Pressable style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={28} color={colors.danger} />
            </View>
            <Text style={styles.modalTitle}>Keluar Akun</Text>
            <Text style={styles.modalDesc}>
              Apakah Anda yakin ingin keluar? Anda perlu masuk kembali untuk mengakses dompet Anda.
            </Text>
            <View style={styles.modalActions}>
              <AnimatedPressable style={styles.modalCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.modalConfirm} onPress={handleLogout}>
                <Text style={styles.modalConfirmText}>Keluar</Text>
              </AnimatedPressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  header: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.sm, borderWidth: 1, borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  editText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  profileCard: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  avatar: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  name: { fontWeight: "700", fontSize: 16, color: colors.textPrimary },
  email: { color: colors.textSecondary, fontSize: 12 },
  tags: { flexDirection: "row", gap: spacing.sm, marginTop: 6 },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  tagText: { fontSize: 11, fontWeight: "700" },
  menuGroupTitle: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.xs, paddingHorizontal: 4 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  menuBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  menuIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  menuTitle: { fontWeight: "600", color: colors.textPrimary, fontSize: 14 },
  menuSub: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  logoutButton: {
    height: 52, borderRadius: radius.md, backgroundColor: colors.danger,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center", padding: spacing.lg,
  },
  modalContent: {
    width: "100%", maxWidth: 340,
    backgroundColor: "#fff", borderRadius: radius.xl,
    padding: spacing.lg, alignItems: "center",
  },
  modalIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center",
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm },
  modalDesc: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: spacing.lg },
  modalActions: { flexDirection: "row", gap: spacing.sm, width: "100%" },
  modalCancel: {
    flex: 1, height: 48, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  modalCancelText: { color: colors.textPrimary, fontWeight: "600", fontSize: 15 },
  modalConfirm: {
    flex: 1, height: 48, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.danger,
  },
  modalConfirmText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  appInfo: { alignItems: "center", paddingVertical: spacing.lg, gap: 4 },
  appInfoLogo: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  appInfoName: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  appInfoDesc: { fontSize: 11, color: colors.textSecondary, textAlign: "center" },
});
