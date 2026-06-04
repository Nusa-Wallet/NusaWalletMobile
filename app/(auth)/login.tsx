import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/store/auth";
import { colors, radius, spacing } from "@/theme/colors";

type Mode = "email" | "phone";

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("email");
  const [email, setEmail] = useState("demo@nusawallet.id");
  const [phone, setPhone] = useState("0812345678");
  const [password, setPassword] = useState("password123");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      // phone login maps to email for demo (backend only has email auth)
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert("Gagal masuk", e?.response?.data?.detail ?? "Periksa kredensial Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo icon */}
          <View style={s.logoWrap}>
            <View style={s.logoBox}>
              <Ionicons name="wallet" size={30} color="#fff" />
            </View>
          </View>

          <Text style={s.title}>Selamat Datang</Text>
          <Text style={s.subtitle}>Masuk ke akun NusaWallet Anda</Text>

          {/* Input fields */}
          {mode === "email" ? (
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="andi.rizky@email.com"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          ) : (
            <View style={s.inputWrap}>
              <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="0812345678"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}

          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={s.inputIcon} />
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholder="password123"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingRight: spacing.md }}>
              <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Remember me + Forgot */}
          <View style={s.rowBetween}>
            <TouchableOpacity style={s.rememberRow} onPress={() => setRemember(!remember)}>
              <View style={[s.checkbox, remember && s.checkboxActive]}>
                {remember && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={s.rememberText}>Ingat saya</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={s.forgotText}>Lupa kata sandi?</Text>
            </TouchableOpacity>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity style={s.btnPrimary} onPress={onSubmit} disabled={loading}>
            <Text style={s.btnPrimaryText}>{loading ? "Memuat..." : "Masuk"}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>atau</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Toggle mode */}
          <TouchableOpacity
            style={s.btnOutline}
            onPress={() => setMode(mode === "email" ? "phone" : "email")}
          >
            <Text style={s.btnOutlineText}>
              {mode === "email" ? "Masuk dengan Nomor HP" : "Masuk dengan E-mail"}
            </Text>
          </TouchableOpacity>

          {/* Security note */}
          <View style={s.securityRow}>
            <Ionicons name="lock-closed-outline" size={13} color={colors.textSecondary} />
            <Text style={s.securityText}>Data Anda dilindungi dengan enkripsi end-to-end</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  logoWrap: { alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.lg },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", color: colors.textPrimary },
  subtitle: { textAlign: "center", color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginBottom: spacing.sm,
  },
  inputIcon: { paddingLeft: spacing.md },
  input: {
    flex: 1, height: 52,
    paddingHorizontal: spacing.sm,
    color: colors.textPrimary, fontSize: 15,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: spacing.sm },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  rememberText: { color: colors.textSecondary, fontSize: 13 },
  forgotText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  btnPrimary: {
    backgroundColor: colors.primary, height: 52,
    borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    marginTop: spacing.sm,
  },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textSecondary, fontSize: 13 },
  btnOutline: {
    height: 52, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  btnOutlineText: { color: colors.textPrimary, fontSize: 15, fontWeight: "600" },
  securityRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.lg },
  securityText: { color: colors.textSecondary, fontSize: 12 },
});
