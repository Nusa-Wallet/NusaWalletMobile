import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Card } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing } from "@/theme/colors";

// Profil — Design 13.
const MENU = [
  { icon: "shield-outline", title: "Keamanan", sub: "2FA aktif, ubah kata sandi" },
  { icon: "globe-outline", title: "Mata Uang", sub: "IDR utama, 4 aktif" },
  { icon: "notifications-outline", title: "Notifikasi", sub: "Email & Push aktif" },
  { icon: "phone-portrait-outline", title: "Perangkat", sub: "2 perangkat terdaftar" },
  { icon: "lock-closed-outline", title: "Privasi", sub: "Kelola data Anda" },
  { icon: "help-circle-outline", title: "Bantuan", sub: "FAQ & dukungan" },
];

export default function Profile() {
  const { logout } = useAuth();
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={styles.header}>Profil</Text>

        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AR</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Andi Rizky</Text>
            <Text style={styles.email}>demo@nusawallet.id</Text>
            <View style={styles.tags}>
              <View style={[styles.tag, { backgroundColor: "#DCFCE7" }]}>
                <Text style={[styles.tagText, { color: colors.success }]}>Terverifikasi</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: "#E5EDFB" }]}>
                <Text style={[styles.tagText, { color: colors.accent }]}>SME</Text>
              </View>
            </View>
          </View>
        </Card>

        <Card style={{ padding: 0 }}>
          {MENU.map((m, i) => (
            <View key={m.title} style={[styles.menuRow, i < MENU.length - 1 && styles.menuBorder]}>
              <View style={styles.menuIcon}>
                <Ionicons name={m.icon as any} size={20} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>{m.title}</Text>
                <Text style={styles.menuSub}>{m.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          ))}
        </Card>

        <Button title="Keluar" variant="outline" onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  profileCard: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  avatar: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  name: { fontWeight: "700", fontSize: 16, color: colors.textPrimary },
  email: { color: colors.textSecondary, fontSize: 12 },
  tags: { flexDirection: "row", gap: spacing.sm, marginTop: 6 },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  tagText: { fontSize: 11, fontWeight: "700" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  menuTitle: { fontWeight: "600", color: colors.textPrimary },
  menuSub: { color: colors.textSecondary, fontSize: 12 },
});
