import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const { width: screenWidth } = useWindowDimensions();

  const [name, setName] = useState(userName ?? "Andi Rizky");
  const [email, setEmail] = useState(userEmail ?? "demo@nusawallet.id");
  const [phone, setPhone] = useState("+62 812 3456 7890");

  function handleSave() {
    Alert.alert("Tersimpan", "Perubahan profil berhasil disimpan.");
    router.back();
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <SubScreenHeader title="Edit Profil" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <StaggerFadeIn index={0}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {name.split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2)}
                </Text>
              </View>
              <AnimatedPressable style={s.changePhotoBtn}>
                <Ionicons name="camera-outline" size={16} color={colors.accent} />
                <Text style={s.changePhotoText}>Ubah Foto</Text>
              </AnimatedPressable>
            </View>
          </StaggerFadeIn>

          <StaggerFadeIn index={1}>
            <Card style={{ gap: spacing.md }}>
              <Field label="Nama Lengkap" value={name} onChangeText={setName} icon="person-outline" />
              <Field label="Email" value={email} onChangeText={setEmail} icon="mail-outline" keyboardType="email-address" />
              <Field label="Nomor Telepon" value={phone} onChangeText={setPhone} icon="call-outline" keyboardType="phone-pad" />
            </Card>
          </StaggerFadeIn>

          <StaggerFadeIn index={2}>
            <AnimatedPressable style={s.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={s.saveBtnText}>Simpan Perubahan</Text>
            </AnimatedPressable>
          </StaggerFadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChangeText, icon, keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldRow}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <TextInput
          style={s.fieldInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? "default"}
          placeholderTextColor={colors.textSecondary}
        />
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
  changePhotoBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  changePhotoText: { color: colors.accent, fontWeight: "600", fontSize: fontSizes.bodyAlt },
  fieldLabel: { fontSize: fontSizes.caption, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
  fieldRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8,
  },
  fieldInput: { flex: 1, color: colors.textPrimary, fontSize: fontSizes.bodyAlt, paddingVertical: 0 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, borderRadius: radius.md, backgroundColor: colors.primary,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: fontSizes.h6 },
});
