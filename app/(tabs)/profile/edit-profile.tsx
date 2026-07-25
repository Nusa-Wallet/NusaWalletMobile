import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthApi } from "@/api/endpoints";
import { Card } from "@/components/ui";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { SubScreenHeader } from "@/components/SubScreenHeader";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
import AnimatedPressable from "@/components/AnimatedPressable";

export default function EditProfile() {
  const { userName, userEmail } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(userName ?? "");
  const [email] = useState(userEmail ?? "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useFocusEffect(useCallback(() => {
    AuthApi.me().then(({ data }) => {
      setName(data.full_name);
      setPhone(data.phone ?? "");
    }).catch(() => {});
  }, []));

  async function handleSave() {
    if (!name.trim()) {
      return Alert.alert("Validasi", "Nama lengkap harus diisi.");
    }
    setSaving(true);
    try {
      await AuthApi.updateProfile({ full_name: name.trim(), phone: phone.trim() || undefined });
      setEditing(false);
      Alert.alert("Tersimpan", "Perubahan profil berhasil disimpan.");
    } catch {
      Alert.alert("Gagal", "Tidak dapat menyimpan perubahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <SubScreenHeader title={editing ? "Edit Profil" : "Detail Profil"} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <StaggerFadeIn index={0}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {name.split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2)}
                </Text>
              </View>
            </View>
          </StaggerFadeIn>

          <StaggerFadeIn index={1}>
            <Card style={{ gap: spacing.md }}>
              <DetailRow icon="person-outline" label="Nama Lengkap" value={name} editing={editing} onChangeText={setName} />
              <View style={s.divider} />
              <ViewRow icon="mail-outline" label="Email" value={email} />
              <View style={s.divider} />
              {editing ? (
                <DetailRow icon="call-outline" label="Nomor Telepon" value={phone} editing={editing} onChangeText={setPhone} keyboardType="phone-pad" />
              ) : (
                <ViewRow icon="call-outline" label="Nomor Telepon" value={phone || "-"} />
              )}
            </Card>
          </StaggerFadeIn>

          <StaggerFadeIn index={2}>
            <AnimatedPressable
              style={[s.actionBtn, editing ? s.saveBtn : s.editBtn, saving && { opacity: 0.6 }]}
              onPress={editing ? handleSave : () => setEditing(true)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name={editing ? "checkmark-circle-outline" : "create-outline"} size={20} color="#fff" />
              )}
              <Text style={s.actionBtnText}>{saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Edit Profil"}</Text>
            </AnimatedPressable>
            {editing && (
              <AnimatedPressable style={s.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={s.cancelBtnText}>Batal</Text>
              </AnimatedPressable>
            )}
          </StaggerFadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon, label, value, editing, onChangeText, keyboardType,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  editing: boolean;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldRow}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        {editing ? (
          <TextInput
            style={s.fieldInput}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType ?? "default"}
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />
        ) : (
          <Text style={s.fieldValue}>{value}</Text>
        )}
      </View>
    </View>
  );
}

function ViewRow({
  icon, label, value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldRow}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <Text style={s.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },
  avatarWrap: { alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 80, height: 80, borderRadius: radius.lg,
    backgroundColor: colors.accent, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: fontSizes.h2 },
  divider: { height: 1, backgroundColor: colors.border },
  fieldLabel: { fontSize: fontSizes.caption, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
  fieldRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8,
  },
  fieldInput: { flex: 1, color: colors.textPrimary, fontSize: fontSizes.bodyAlt, paddingVertical: 0 },
  fieldValue: { flex: 1, color: colors.textPrimary, fontSize: fontSizes.bodyAlt },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, borderRadius: radius.md,
  },
  editBtn: { backgroundColor: colors.primary },
  saveBtn: { backgroundColor: colors.accent },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: fontSizes.h6 },
  cancelBtn: {
    alignItems: "center", justifyContent: "center",
    height: 44, marginTop: spacing.sm,
  },
  cancelBtnText: { color: colors.textSecondary, fontWeight: "600", fontSize: fontSizes.bodyAlt },
});
