import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing } from "@/theme/colors";

// Login — Design 05/06. Prefilled with the seeded demo account.
export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@nusawallet.id");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert("Gagal masuk", e?.response?.data?.detail ?? "Periksa email/kata sandi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logo}>
        <Ionicons name="wallet" size={28} color="#fff" />
      </View>
      <Text style={styles.title}>Selamat Datang</Text>
      <Text style={styles.subtitle}>Masuk ke akun NusaWallet Anda</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="anda@email.com"
      />
      <Text style={styles.label}>Kata Sandi</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      <Button title="Masuk" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.lg }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  logo: {
    width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: spacing.xl,
  },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", marginTop: spacing.md, color: colors.textPrimary },
  subtitle: { textAlign: "center", color: colors.textSecondary, marginBottom: spacing.xl },
  label: { fontWeight: "600", color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50,
  },
});
