import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/store/auth";
import { colors, radius, spacing } from "@/theme/colors";

type Mode = "email" | "phone";

export default function Login() {
  const { login } = useAuth();
  const { registered, email: registeredEmail } = useLocalSearchParams<{
    registered?: string;
    email?: string;
  }>();
  const [mode, setMode] = useState<Mode>("email");
  const [email, setEmail] = useState(registeredEmail ?? "demo@nusawallet.id");
  const [phone, setPhone] = useState("081234567890");
  const [password, setPassword] = useState(registered === "success" ? "" : "password123");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    registered === "success" ? "Akun berhasil dibuat. Silakan masuk dengan akun baru Anda." : null,
  );
  const credentialShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (registered === "success") {
      setSuccess("Akun berhasil dibuat. Silakan masuk dengan akun baru Anda.");
      setMode("email");
      setPassword("");
      if (registeredEmail) setEmail(registeredEmail);
    }
  }, [registered, registeredEmail]);

  function rejectLogin(message: string) {
    setError(message);
    credentialShake.setValue(0);
    Animated.sequence([
      Animated.timing(credentialShake, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(credentialShake, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(credentialShake, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(credentialShake, { toValue: 7, duration: 55, useNativeDriver: true }),
      Animated.timing(credentialShake, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }

  async function onSubmit() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const identifier = mode === "email" ? email.trim() : phone.trim();
      if (!identifier) {
        rejectLogin(mode === "email" ? "Mohon masukkan email." : "Mohon masukkan nomor HP.");
        return;
      }
      if (mode === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        rejectLogin("Mohon masukkan email yang tepat");
        return;
      }
      if (mode === "phone" && identifier.length < 10) {
        rejectLogin("Mohon masukkan nomor HP yang tepat");
        return;
      }
      if (!password) {
        rejectLogin("Mohon masukkan kata sandi.");
        return;
      }
      await login(identifier, password, mode);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        rejectLogin(
          mode === "email"
            ? "Email atau kata sandi tidak sesuai."
            : "Nomor HP atau kata sandi tidak sesuai.",
        );
      } else if (e?.response) {
        rejectLogin("Data login tidak valid. Mohon periksa kembali.");
      } else {
        rejectLogin("Tidak dapat terhubung ke server. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.form}>

            {/* Logo icon */}
            <View style={s.logoWrap}>
              <View style={s.logoBox}>
                <Ionicons name="wallet" size={30} color="#fff" />
              </View>
            </View>

            <Text style={s.title}>Selamat Datang</Text>
            <Text style={s.subtitle}>Masuk ke akun NusaWallet Anda</Text>

            {success && (
              <View style={s.successBox} accessibilityRole="alert">
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <View style={s.successContent}>
                  <Text style={s.successTitle}>Registrasi berhasil</Text>
                  <Text style={s.successText}>{success}</Text>
                </View>
              </View>
            )}

            {error && (
              <View style={s.errorBox} accessibilityRole="alert">
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <View style={s.errorContent}>
                  <Text style={s.errorTitle}>Login gagal</Text>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              </View>
            )}

            {/* Input fields */}
            <Animated.View style={{ transform: [{ translateX: credentialShake }] }}>
              {mode === "email" ? (
                <View style={s.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setError(null);
                  }}
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
                    onChangeText={(value) => {
                      setPhone(value.replace(/\D/g, ""));
                      setError(null);
                    }}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={15}
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
                  onChangeText={(value) => {
                    setPassword(value);
                    setError(null);
                  }}
                  secureTextEntry={!showPass}
                  placeholder="Masukkan password"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingRight: spacing.md }}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </Animated.View>

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
              onPress={() => {
                setMode(mode === "email" ? "phone" : "email");
                setError(null);
              }}
            >
              <Text style={s.btnOutlineText}>
                {mode === "email" ? "Masuk dengan Nomor HP" : "Masuk dengan E-mail"}
              </Text>
            </TouchableOpacity>

            {/* Registration CTA */}
            <View style={s.registerSection}>
              <Text style={s.registerPrompt}>Belum punya akun NusaWallet?</Text>
              <TouchableOpacity
                style={s.btnRegister}
                accessibilityRole="button"
                accessibilityLabel="Daftar akun baru"
                onPress={() => {
                  setSuccess(null);
                  router.push("/(auth)/register");
                }}
              >
                <Ionicons name="person-add-outline" size={18} color={colors.accent} />
                <Text style={s.registerLink}>Daftar Akun Baru</Text>
              </TouchableOpacity>
            </View>

            {/* Security note */}
            <View style={s.securityRow}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.textSecondary} />
              <Text style={s.securityText}>Data Anda dilindungi dengan enkripsi end-to-end</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  form: { width: "100%", maxWidth: 480, alignSelf: "center" },
  logoWrap: { alignItems: "center", marginBottom: spacing.lg },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", color: colors.textPrimary },
  subtitle: { textAlign: "center", color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: spacing.sm,
    backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA",
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  errorContent: { flex: 1 },
  errorTitle: { color: colors.danger, fontSize: 14, fontWeight: "700" },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: 2 },
  successBox: {
    flexDirection: "row", alignItems: "flex-start", gap: spacing.sm,
    backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0",
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  successContent: { flex: 1 },
  successTitle: { color: colors.success, fontSize: 14, fontWeight: "700" },
  successText: { color: "#166534", fontSize: 13, lineHeight: 18, marginTop: 2 },
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
  registerSection: { alignItems: "center", gap: spacing.sm, marginTop: spacing.lg },
  registerPrompt: { color: colors.textSecondary, fontSize: 13 },
  btnRegister: {
    width: "100%", height: 48, borderRadius: radius.md,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    borderWidth: 1, borderColor: "#BFDBFE", backgroundColor: "#EFF6FF",
  },
  registerLink: { color: colors.accent, fontSize: 14, fontWeight: "700" },
  securityRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.lg },
  securityText: { color: colors.textSecondary, fontSize: 12 },
});
