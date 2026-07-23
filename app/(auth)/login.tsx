import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { FormField, PasswordToggle } from "@/components/FormField";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
import { scale } from "@/utils/responsive";
import AnimatedPressable from "@/components/AnimatedPressable";

type Mode = "email" | "phone";

function useShake() {
  const translateX = useSharedValue(0);
  const shake = () => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-7, { duration: 55 }),
      withTiming(7, { duration: 55 }),
      withTiming(0, { duration: 55 }),
    );
  };
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  return { shake, animatedStyle };
}

export default function Login() {
  const { width: screenWidth } = useWindowDimensions();
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
  const { shake, animatedStyle } = useShake();
  const btnIconSize = scale(18, screenWidth);

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
    shake();
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
            <StaggerFadeIn index={0}>
              <View style={s.logoWrap}>
                <View style={s.logoBox}>
                  <Ionicons name="wallet" size={30} color="#fff" />
                </View>
              </View>
              <Text style={s.title}>Selamat Datang</Text>
              <Text style={s.subtitle}>Masuk ke akun NusaWallet Anda</Text>
            </StaggerFadeIn>

            {success && (
              <StaggerFadeIn index={1}>
                <View style={s.successBox} accessibilityRole="alert">
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <View style={s.successContent}>
                    <Text style={s.successTitle}>Registrasi berhasil</Text>
                    <Text style={s.successText}>{success}</Text>
                  </View>
                </View>
              </StaggerFadeIn>
            )}

            {error && (
              <StaggerFadeIn index={1}>
                <View style={s.errorBox} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={20} color={colors.danger} />
                  <View style={s.errorContent}>
                    <Text style={s.errorTitle}>Login gagal</Text>
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                </View>
              </StaggerFadeIn>
            )}

            <StaggerFadeIn index={2}>
              <Animated.View style={animatedStyle}>
                {mode === "email" ? (
                  <FormField
                    icon="mail-outline"
                    value={email}
                    onChangeText={(value) => { setEmail(value); setError(null); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="andi.rizky@email.com"
                  />
                ) : (
                  <FormField
                    icon="call-outline"
                    value={phone}
                    onChangeText={(value) => { setPhone(value.replace(/\D/g, "")); setError(null); }}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={15}
                    placeholder="0812345678"
                  />
                )}

                <FormField
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={(value) => { setPassword(value); setError(null); }}
                  secureTextEntry={!showPass}
                  placeholder="Masukkan password"
                  rightElement={<PasswordToggle show={showPass} onToggle={() => setShowPass(!showPass)} />}
                />
              </Animated.View>
            </StaggerFadeIn>

            <StaggerFadeIn index={3}>
              <View style={s.rowBetween}>
                <AnimatedPressable style={s.rememberRow} onPress={() => setRemember(!remember)}>
                  <View style={[s.checkbox, remember && s.checkboxActive]}>
                    {remember && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={s.rememberText}>Ingat saya</Text>
                </AnimatedPressable>
                <AnimatedPressable>
                  <Text style={s.forgotText}>Lupa kata sandi?</Text>
                </AnimatedPressable>
              </View>
            </StaggerFadeIn>

            <StaggerFadeIn index={4}>
              <AnimatedPressable style={[s.btnPrimary, loading && { opacity: 0.65 }]} onPress={onSubmit} disabled={loading}>
                <Text style={s.btnPrimaryText}>{loading ? "Memuat..." : "Masuk"}</Text>
              </AnimatedPressable>
            </StaggerFadeIn>

            <StaggerFadeIn index={5}>
              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>atau</Text>
                <View style={s.dividerLine} />
              </View>
            </StaggerFadeIn>

            <StaggerFadeIn index={6}>
              <AnimatedPressable
                style={s.btnOutline}
                onPress={() => {
                  setMode(mode === "email" ? "phone" : "email");
                  setError(null);
                }}
              >
                <Text style={s.btnOutlineText}>
                  {mode === "email" ? "Masuk dengan Nomor HP" : "Masuk dengan E-mail"}
                </Text>
              </AnimatedPressable>
            </StaggerFadeIn>

            <StaggerFadeIn index={7}>
              <View style={s.registerSection}>
                <Text style={s.registerPrompt}>Belum punya akun NusaWallet?</Text>
                <AnimatedPressable
                  accessibilityRole="button"
                  accessibilityLabel="Daftar akun baru"
                  onPress={() => {
                    setSuccess(null);
                    router.push("/(auth)/register");
                  }}
                  style={s.btnRegister}
                >
                  <Ionicons name="person-add-outline" size={btnIconSize} color={colors.accent} />
                  <Text style={s.registerLink}>Daftar Akun Baru</Text>
                </AnimatedPressable>
              </View>
            </StaggerFadeIn>

            <StaggerFadeIn index={8}>
              <View style={s.securityRow}>
                <Ionicons name="lock-closed-outline" size={13} color={colors.textSecondary} />
                <Text style={s.securityText}>Data Anda dilindungi dengan enkripsi end-to-end</Text>
              </View>
            </StaggerFadeIn>
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
    width: 64, height: 64, borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: fontSizes.h2, fontWeight: "700", textAlign: "center", color: colors.textPrimary },
  subtitle: { textAlign: "center", color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl, fontSize: fontSizes.body, lineHeight: 22 },
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: spacing.sm,
    backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA",
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  errorContent: { flex: 1 },
  errorTitle: { color: colors.danger, fontSize: fontSizes.bodyAlt, fontWeight: "700" },
  errorText: { color: colors.danger, fontSize: fontSizes.caption, lineHeight: 18, marginTop: 2 },
  successBox: {
    flexDirection: "row", alignItems: "flex-start", gap: spacing.sm,
    backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0",
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  successContent: { flex: 1 },
  successTitle: { color: colors.success, fontSize: fontSizes.bodyAlt, fontWeight: "700" },
  successText: { color: "#166534", fontSize: fontSizes.caption, lineHeight: 18, marginTop: 2 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: spacing.sm },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  rememberText: { color: colors.textSecondary, fontSize: fontSizes.caption },
  forgotText: { color: colors.accent, fontSize: fontSizes.caption, fontWeight: "600" },
  btnPrimary: {
    backgroundColor: colors.primary, height: 52,
    borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    marginTop: spacing.sm,
  },
  btnPrimaryText: { color: "#fff", fontSize: fontSizes.h6, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textSecondary, fontSize: fontSizes.caption },
  btnOutline: {
    height: 52, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  btnOutlineText: { color: colors.textPrimary, fontSize: fontSizes.body, fontWeight: "600" },
  registerSection: { alignItems: "center", gap: spacing.sm, marginTop: spacing.lg },
  registerPrompt: { color: colors.textSecondary, fontSize: fontSizes.caption },
  btnRegister: {
    width: "100%", height: 48, borderRadius: radius.md,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    borderWidth: 1, borderColor: `${colors.accent}40`, backgroundColor: `${colors.accent}10`,
  },
  registerLink: { color: colors.accent, fontSize: fontSizes.bodyAlt, fontWeight: "700" },
  securityRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.lg },
  securityText: { color: colors.textSecondary, fontSize: fontSizes.label },
});
