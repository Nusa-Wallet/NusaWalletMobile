import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/store/auth";
import { colors, radius, spacing } from "@/theme/colors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type RegisterField = "name" | "email" | "phone" | "password" | "confirmPassword";

function shakeField(value: Animated.Value) {
  value.setValue(0);
  Animated.sequence([
    Animated.timing(value, { toValue: -10, duration: 55, useNativeDriver: true }),
    Animated.timing(value, { toValue: 10, duration: 55, useNativeDriver: true }),
    Animated.timing(value, { toValue: -7, duration: 55, useNativeDriver: true }),
    Animated.timing(value, { toValue: 7, duration: 55, useNativeDriver: true }),
    Animated.timing(value, { toValue: 0, duration: 55, useNativeDriver: true }),
  ]).start();
}

export default function Register() {
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
  const nameShake = useRef(new Animated.Value(0)).current;
  const emailShake = useRef(new Animated.Value(0)).current;
  const phoneShake = useRef(new Animated.Value(0)).current;
  const passwordShake = useRef(new Animated.Value(0)).current;
  const confirmPasswordShake = useRef(new Animated.Value(0)).current;

  const shakeValues: Record<RegisterField, Animated.Value> = {
    name: nameShake,
    email: emailShake,
    phone: phoneShake,
    password: passwordShake,
    confirmPassword: confirmPasswordShake,
  };
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
    if (field) shakeField(shakeValues[field]);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.form}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Kembali ke halaman login"
              onPress={() => router.back()}
              style={s.backButton}
            >
              <Ionicons name="arrow-back" size={21} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={s.logoWrap}>
              <View style={s.logoBox}>
                <Ionicons name="person-add" size={27} color="#fff" />
              </View>
            </View>

            <Text style={s.title}>Buat Akun NusaWallet</Text>
            <Text style={s.subtitle}>Daftar sekali untuk mulai mengelola keuangan Anda</Text>

            {error && (
              <View style={s.errorBox} accessibilityRole="alert">
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <View style={s.errorContent}>
                  <Text style={s.errorTitle}>Registrasi gagal</Text>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              </View>
            )}

            <Animated.View style={{ transform: [{ translateX: nameShake }] }}>
              <View style={[s.inputWrap, invalidField === "name" && s.inputError]}>
                <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={s.inputIcon} />
                <TextInput
                  value={fullName}
                  onChangeText={(value) => { setFullName(value); clearError("name"); }}
                  style={s.input}
                  placeholder="Nama lengkap"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  textContentType="name"
                />
              </View>
            </Animated.View>

            <Animated.View style={{ transform: [{ translateX: emailShake }] }}>
              <View style={[s.inputWrap, invalidField === "email" && s.inputError]}>
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={s.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={(value) => { setEmail(value); clearError("email"); }}
                  style={s.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
              </View>
            </Animated.View>

            <Animated.View style={{ transform: [{ translateX: phoneShake }] }}>
              <View style={[s.inputWrap, invalidField === "phone" && s.inputError]}>
                <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={s.inputIcon} />
                <TextInput
                  value={phone}
                  onChangeText={(value) => { setPhone(value.replace(/\D/g, "")); clearError("phone"); }}
                  style={s.input}
                  placeholder="Nomor telepon"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={13}
                  textContentType="telephoneNumber"
                />
              </View>
            </Animated.View>

            <Animated.View style={{ transform: [{ translateX: passwordShake }] }}>
              <View style={[s.inputWrap, invalidField === "password" && s.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={s.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={(value) => { setPassword(value); clearError("password"); }}
                  style={s.input}
                  placeholder="Kata sandi"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPass}
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={showPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  onPress={() => setShowPass(!showPass)}
                  style={s.eyeButton}
                >
                  <Ionicons
                    name={showPass ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

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

            <Animated.View style={{ transform: [{ translateX: confirmPasswordShake }] }}>
              <View style={[s.inputWrap, invalidField === "confirmPassword" && s.inputError]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} style={s.inputIcon} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={(value) => { setConfirmPassword(value); clearError("confirmPassword"); }}
                  style={s.input}
                  placeholder="Ulangi kata sandi"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPass}
                  textContentType="newPassword"
                  onSubmitEditing={() => void onSubmit()}
                />
              </View>
            </Animated.View>

            <Text style={s.termsText}>
              Dengan mendaftar, Anda menyetujui ketentuan penggunaan dan kebijakan privasi NusaWallet.
            </Text>

            <TouchableOpacity
              accessibilityRole="button"
              style={[s.btnPrimary, loading && s.btnDisabled]}
              onPress={() => void onSubmit()}
              disabled={loading}
            >
              <Text style={s.btnPrimaryText}>{loading ? "Mendaftarkan..." : "Daftar Sekarang"}</Text>
            </TouchableOpacity>

            <View style={s.loginRow}>
              <Text style={s.loginPrompt}>Sudah punya akun?</Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")} hitSlop={8}>
                <Text style={s.loginLink}>Masuk</Text>
              </TouchableOpacity>
            </View>

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
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", color: colors.textPrimary },
  subtitle: {
    textAlign: "center", color: colors.textSecondary,
    marginTop: 4, marginBottom: spacing.lg, lineHeight: 20,
  },
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: spacing.sm,
    backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA",
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  errorContent: { flex: 1 },
  errorTitle: { color: colors.danger, fontSize: 14, fontWeight: "700" },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: 2 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginBottom: spacing.sm,
  },
  inputError: { borderColor: colors.danger, borderWidth: 1.5, backgroundColor: "#FFF7F7" },
  inputIcon: { paddingLeft: spacing.md },
  input: {
    flex: 1, height: 52, paddingHorizontal: spacing.sm,
    color: colors.textPrimary, fontSize: 15,
  },
  eyeButton: { paddingHorizontal: spacing.md, height: 52, justifyContent: "center" },
  strengthWrap: { marginTop: -2, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  strengthHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 6,
  },
  strengthLabel: { color: colors.textSecondary, fontSize: 12 },
  strengthValue: { fontSize: 12, fontWeight: "700" },
  strengthBars: { flexDirection: "row", gap: 5 },
  strengthBar: { flex: 1, height: 4, borderRadius: 4, backgroundColor: colors.border },
  passwordHint: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 6 },
  termsText: {
    color: colors.textSecondary, fontSize: 12, lineHeight: 18,
    textAlign: "center", marginTop: spacing.xs,
  },
  btnPrimary: {
    backgroundColor: colors.primary, height: 52,
    borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    marginTop: spacing.md,
  },
  btnDisabled: { opacity: 0.65 },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loginRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    flexWrap: "wrap", gap: 5, marginTop: spacing.md,
  },
  loginPrompt: { color: colors.textSecondary, fontSize: 13 },
  loginLink: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  securityRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: spacing.lg,
  },
  securityText: { color: colors.textSecondary, fontSize: 12, textAlign: "center" },
});
