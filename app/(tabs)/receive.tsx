import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_URL } from "@/api/client";
import { PaymentApi } from "@/api/endpoints";
import { Button, Card } from "@/components/ui";
import { colors, radius, spacing } from "@/theme/colors";

// Terima Pembayaran — Design 10/11. Generate a payment link in a target currency.
const CCYS = ["USD", "SGD", "EUR", "MYR"];

export default function Receive() {
  const [currency, setCurrency] = useState("SGD");
  const [amount, setAmount] = useState("500");
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const { data } = await PaymentApi.create(currency, Number(amount));
      setLink(`${API_URL}${data.url}`);
    } catch (e: any) {
      Alert.alert("Gagal", e?.response?.data?.detail ?? "Tidak dapat membuat link.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (link) {
      await Clipboard.setStringAsync(link);
      Alert.alert("Disalin", "Link pembayaran disalin ke clipboard.");
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={styles.header}>Terima Pembayaran</Text>

        <Text style={styles.label}>Mata Uang</Text>
        <View style={styles.ccyRow}>
          {CCYS.map((c) => (
            <Pressable key={c} onPress={() => setCurrency(c)} style={[styles.chip, currency === c && styles.chipActive]}>
              <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Jumlah</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />

        <Button title="Buat Link Pembayaran" onPress={generate} loading={loading} />

        {link && (
          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.label}>Link Pembayaran</Text>
            <Text selectable style={styles.link}>{link}</Text>
            <Button title="Salin Link" variant="outline" onPress={copy} />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  label: { fontWeight: "600", color: colors.textPrimary },
  ccyRow: { flexDirection: "row", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50 },
  link: { color: colors.accent },
});
