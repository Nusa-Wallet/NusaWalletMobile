import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/components/ui";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { useAuth } from "@/store/auth";
import { palette, colors, radius, spacing } from "@/theme/colors";
import { fonts, fontSizes } from "@/theme/typography";
import { scale } from "@/utils/responsive";
import AnimatedPressable from "@/components/AnimatedPressable";

const MENU_ITEMS = [
  { icon: "shield-outline", title: "Keamanan", sub: "2FA, kata sandi, verifikasi", route: "/(tabs)/profile/security" },
  { icon: "notifications-outline", title: "Notifikasi", sub: "Push, email & pengingat", route: "/(tabs)/profile/notifications" },
  { icon: "lock-closed-outline", title: "Privasi", sub: "Kebijakan data & izin", route: "/(tabs)/profile/privacy" },
  { icon: "help-circle-outline", title: "Bantuan", sub: "FAQ, dukungan & pusat bantuan", route: "/(tabs)/profile/help" },
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

  const displayName = userName ?? "";
  const displayEmail = userEmail ?? "";

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
          </View>
        </StaggerFadeIn>

        <StaggerFadeIn index={1}>
          <AnimatedPressable onPress={() => router.push("/(tabs)/profile/edit-profile" as any)}>
            <Card style={styles.profileCard}>
<View style={[styles.avatar, { width: avatarSize, height: avatarSize }]}>
              <Text style={[styles.avatarText, { fontSize: avatarSize * 0.32 }]}>{INITIALS(displayName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.email}>{displayEmail}</Text>
                {displayEmail ? (
                  <View style={styles.tags}>
                    <View style={[styles.tag, { backgroundColor: "#DCFCE7" }]}>
                      <Text style={[styles.tagText, { color: colors.success }]}>Terverifikasi</Text>
                    </View>
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Card>
          </AnimatedPressable>
        </StaggerFadeIn>

        <StaggerFadeIn index={3}>
          <Card style={{ padding: 0 }}>
            {MENU_ITEMS.map((m, i) => (
              <AnimatedPressable key={m.title} onPress={() => router.push(m.route as any)}>
                <View style={[styles.menuRow, i < MENU_ITEMS.length - 1 && styles.menuBorder]}>
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
        </StaggerFadeIn>

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
              <Image source={require("@/../assets/app-icon.png")} style={{ width: 22, height: 22 }} resizeMode="contain" />
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
  header: { fontSize: fontSizes.h2, fontFamily: fonts.bold, color: colors.textPrimary },
  profileCard: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  avatar: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontFamily: fonts.bold, fontSize: fontSizes.h3 },
  name: { fontFamily: fonts.bold, fontSize: fontSizes.bodyAlt, color: colors.textPrimary },
  email: { color: colors.textSecondary, fontSize: fontSizes.caption, fontFamily: fonts.regular },
  tags: { flexDirection: "row", gap: spacing.sm, marginTop: 6 },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  tagText: { fontSize: fontSizes.small, fontFamily: fonts.bold },
  menuRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  menuBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  menuIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  menuTitle: { fontFamily: fonts.semibold, color: colors.textPrimary, fontSize: fontSizes.bodyAlt },
  menuSub: { color: colors.textSecondary, fontSize: fontSizes.caption, fontFamily: fonts.regular, marginTop: 1 },
  logoutButton: {
    height: 52, borderRadius: radius.md, backgroundColor: colors.danger,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
  },
  logoutText: { color: "#fff", fontSize: fontSizes.h6, fontFamily: fonts.bold },
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
    backgroundColor: palette.red10, alignItems: "center", justifyContent: "center",
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: fontSizes.h4, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  modalDesc: { fontSize: fontSizes.bodyAlt, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: spacing.lg },
  modalActions: { flexDirection: "row", gap: spacing.sm, width: "100%" },
  modalCancel: {
    flex: 1, height: 44, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  modalCancelText: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: fontSizes.body },
  modalConfirm: {
    flex: 1, height: 44, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.danger,
  },
  modalConfirmText: { color: "#fff", fontFamily: fonts.bold, fontSize: fontSizes.body },
  appInfo: { alignItems: "center", paddingVertical: spacing.lg, gap: 4 },
  appInfoLogo: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: palette.blue10, alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  appInfoName: { fontSize: fontSizes.caption, fontFamily: fonts.semibold, color: colors.textPrimary },
  appInfoDesc: { fontSize: fontSizes.small, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: "center" },
});
