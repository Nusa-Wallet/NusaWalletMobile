import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type RegisterField = "name" | "email" | "phone" | "password" | "confirmPassword";

function useShakeField() {
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

export default function Register() {
  const { width: screenWidth } = useWindowDimensions();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<RegisterField | null>(null);
  const formShake = useShakeField();
  const btnIconSize = scale(18, screenWidth);

  const passwordChecks = [
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const passwordScore = passwordChecks.filter(Boolean).length;
  const passwordStrength = passwordScore <= 1 ? "Lemah" : passwordScore <= 3 ? "Cukup" : "Kuat";
  const passwordStrengthColor = passwordScore <= 1
    ? colors.danger
    : passwordScore <= 3
      ? colors.warning
      : colors.success;

  function clearError(field: RegisterField) {
    if (error) setError(null);
    if (invalidField === field) setInvalidField(null);
  }

  function rejectRegistration(message: string, field?: RegisterField) {
    setError(message);
    setInvalidField(field ?? null);
    if (field) formShake.shake();
  }

  async function onSubmit() {
    setError(null);

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (normalizedName.length < 2) {
      rejectRegistration("Mohon masukkan nama lengkap Anda.", "name");
      return;
    }
    if (/\d/.test(normalizedName)) {
      rejectRegistration("Nama tidak boleh mengandung angka.", "name");
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      rejectRegistration("Mohon masukkan email yang tepat.", "email");
      return;
    }
    if (!normalizedPhone) {
      rejectRegistration("Nomor HP wajib diisi.", "phone");
      return;
    }
    if (!/^08\d{10,11}$/.test(normalizedPhone)) {
      rejectRegistration("Nomor HP harus 12–13 digit dan diawali 08.", "phone");
      return;
    }
    if (password.length < 8) {
      rejectRegistration("Kata sandi minimal 8 karakter.", "password");
      return;
    }
    if (password !== confirmPassword) {
      rejectRegistration("Konfirmasi kata sandi belum sesuai.", "confirmPassword");
      return;
    }

    setLoading(true);
    try {
      await register({
        email: normalizedEmail,
        full_name: normalizedName,
        password,
        phone: normalizedPhone,
      });
      router.replace({
        pathname: "/(auth)/login",
        params: { registered: "success", email: normalizedEmail },
      });
    } catch (e: any) {
      if (e?.response?.status === 409) {
        const detail = String(e.response.data?.detail ?? "").toLowerCase();
        const isPhoneConflict = detail.includes("phone");
        rejectRegistration(
          isPhoneConflict
            ? "Nomor HP sudah terdaftar. Silakan masuk."
            : "Email sudah terdaftar. Silakan masuk.",
          isPhoneConflict ? "phone" : "email",
        );
      } else if (e?.response) {
        rejectRegistration("Data registrasi tidak valid. Mohon periksa kembali.");
      } else {
        rejectRegistration("Tidak dapat terhubung ke server. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.flex}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.form}>
            <StaggerFadeIn index={0}>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel="Kembali ke halaman login"
                onPress={() => router.back()}
                style={s.backButton}
              >
                <Ionicons name="arrow-back" size={21} color={colors.textPrimary} />
              </AnimatedPressable>

              <View style={s.logoWrap}>
                <View style={s.logoBox}>
                  <Ionicons name="person-add" size={27} color="#fff" />
                </View>
              </View>

              <Text style={s.title}>Buat Akun NusaWallet</Text>
              <Text style={s.subtitle}>Daftar sekali untuk mulai mengelola keuangan Anda</Text>
            </StaggerFadeIn>

            {error && (
              <StaggerFadeIn index={1}>
                <View style={s.errorBox} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={20} color={colors.danger} />
                  <View style={s.errorContent}>
                    <Text style={s.errorTitle}>Registrasi gagal</Text>
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                </View>
              </StaggerFadeIn>
            )}

            <StaggerFadeIn index={2}>
              <Animated.View style={formShake.animatedStyle}>
                <FormField
                  icon="person-outline"
                  value={fullName}
                  onChangeText={(value) => { setFullName(value); clearError("name"); }}
                  placeholder="Nama lengkap"
                  autoCapitalize="words"
                  textContentType="name"
                  error={invalidField === "name"}
                />

                <FormField
                  icon="mail-outline"
                  value={email}
                  onChangeText={(value) => { setEmail(value); clearError("email"); }}
                  placeholder="Email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  error={invalidField === "email"}
                />

                <FormField
                  icon="call-outline"
                  value={phone}
                  onChangeText={(value) => { setPhone(value.replace(/\D/g, "")); clearError("phone"); }}
                  placeholder="Nomor telepon"
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={13}
                  textContentType="telephoneNumber"
                  error={invalidField === "phone"}
                />

                <FormField
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={(value) => { setPassword(value); clearError("password"); }}
                  placeholder="Kata sandi"
                  secureTextEntry={!showPass}
                  textContentType="newPassword"
                  error={invalidField === "password"}
                  rightElement={<PasswordToggle show={showPass} onToggle={() => setShowPass(!showPass)} />}
                />
              </Animated.View>
            </StaggerFadeIn>

            <StaggerFadeIn index={3}>
              <View style={s.strengthWrap}>
                <View style={s.strengthHeader}>
                  <Text style={s.strengthLabel}>Kekuatan password</Text>
                  <Text style={[s.strengthValue, { color: passwordStrengthColor }]}>
                    {password ? passwordStrength : "Belum diisi"}
                  </Text>
                </View>
                <View style={s.strengthBars}>
                  {[0, 1, 2, 3].map((index) => (
                    <View
                      key={index}
                      style={[
                        s.strengthBar,
                        index < passwordScore && { backgroundColor: passwordStrengthColor },
                      ]}
                    />
                  ))}
                </View>
                <Text style={s.passwordHint}>
                  Password kuat: minimal 12 karakter, huruf besar-kecil, angka, dan simbol.
                </Text>
              </View>
            </StaggerFadeIn>

            <StaggerFadeIn index={4}>
              <Animated.View style={formShake.animatedStyle}>
                <FormField
                  icon="shield-checkmark-outline"
                  value={confirmPassword}
                  onChangeText={(value) => { setConfirmPassword(value); clearError("confirmPassword"); }}
                  placeholder="Ulangi kata sandi"
                  secureTextEntry={!showPass}
                  textContentType="newPassword"
                  error={invalidField === "confirmPassword"}
                  onSubmitEditing={() => void onSubmit()}
                />
              </Animated.View>
            </StaggerFadeIn>

            <StaggerFadeIn index={5}>
              <Text style={s.termsText}>
                Dengan mendaftar, Anda menyetujui ketentuan penggunaan dan kebijakan privasi NusaWallet.
              </Text>
            </StaggerFadeIn>

            <StaggerFadeIn index={6}>
              <AnimatedPressable
                accessibilityRole="button"
                style={[s.btnPrimary, loading && { opacity: 0.65 }]}
                onPress={() => void onSubmit()}
                disabled={loading}
              >
                <Text style={s.btnPrimaryText}>{loading ? "Mendaftarkan..." : "Daftar Sekarang"}</Text>
              </AnimatedPressable>
            </StaggerFadeIn>

            <StaggerFadeIn index={7}>
              <View style={s.loginRow}>
                <Text style={s.loginPrompt}>Sudah punya akun?</Text>
                <AnimatedPressable onPress={() => router.replace("/(auth)/login")} hitSlop={8}>
                  <Text style={s.loginLink}>Masuk</Text>
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
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  form: { width: "100%", maxWidth: 480, alignSelf: "center" },
  backButton: {
    width: 42, height: 42, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  logoWrap: { alignItems: "center", marginBottom: spacing.md },
  logoBox: {
    width: 64, height: 64, borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: fontSizes.h2, fontWeight: "700", textAlign: "center", color: colors.textPrimary },
  subtitle: {
    textAlign: "center", color: colors.textSecondary,
    marginTop: 4, marginBottom: spacing.lg, lineHeight: 22, fontSize: fontSizes.body,
  },
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: spacing.sm,
    backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA",
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  errorContent: { flex: 1 },
  errorTitle: { color: colors.danger, fontSize: fontSizes.bodyAlt, fontWeight: "700" },
  errorText: { color: colors.danger, fontSize: fontSizes.caption, lineHeight: 18, marginTop: 2 },
  strengthWrap: { marginTop: -2, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  strengthHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 6,
  },
  strengthLabel: { color: colors.textSecondary, fontSize: fontSizes.label },
  strengthValue: { fontSize: fontSizes.label, fontWeight: "700" },
  strengthBars: { flexDirection: "row", gap: 5 },
  strengthBar: { flex: 1, height: 4, borderRadius: 4, backgroundColor: colors.border },
  passwordHint: { color: colors.textSecondary, fontSize: fontSizes.small, lineHeight: 16, marginTop: 6 },
  termsText: {
    color: colors.textSecondary, fontSize: fontSizes.label, lineHeight: 18,
    textAlign: "center", marginTop: spacing.xs,
  },
  btnPrimary: {
    backgroundColor: colors.primary, height: 52,
    borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    marginTop: spacing.md,
  },
  btnPrimaryText: { color: "#fff", fontSize: fontSizes.h6, fontWeight: "700" },
  loginRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    flexWrap: "wrap", gap: 5, marginTop: spacing.md,
  },
  loginPrompt: { color: colors.textSecondary, fontSize: fontSizes.caption },
  loginLink: { color: colors.accent, fontSize: fontSizes.caption, fontWeight: "700" },
  securityRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: spacing.lg,
  },
  securityText: { color: colors.textSecondary, fontSize: fontSizes.label, textAlign: "center" },
});
