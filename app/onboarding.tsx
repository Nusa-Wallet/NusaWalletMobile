import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui";
import { colors, spacing } from "@/theme/colors";

// Onboarding carousel — Design 01-04.
const SLIDES = [
  { icon: "globe-outline", title: "Terima Pembayaran Global", desc: "Terima dana dari klien di seluruh dunia dengan mudah dan cepat." },
  { icon: "wallet-outline", title: "Simpan Multi Mata Uang", desc: "Kelola USD, SGD, EUR, MYR dan lainnya dalam satu dompet digital." },
  { icon: "sparkles-outline", title: "AI Insights & Proteksi", desc: "Dapatkan rekomendasi konversi cerdas dan perlindungan fraud real-time." },
];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name={slide.icon as any} size={56} color={colors.accent} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>
        <View style={styles.dots}>
          {SLIDES.map((_, idx) => (
            <View key={idx} style={[styles.dot, idx === i && styles.dotActive]} />
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <Button
          title={last ? "Mulai Sekarang" : "Lanjut"}
          onPress={() => (last ? router.replace("/(auth)/login") : setI(i + 1))}
        />
        <Link href="/(auth)/login" style={styles.skip}>
          Masuk
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 110, height: 110, borderRadius: 28, backgroundColor: "#E5EDFB",
    alignItems: "center", justifyContent: "center", marginBottom: spacing.lg,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.textPrimary, textAlign: "center" },
  desc: { fontSize: 15, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.md },
  dots: { flexDirection: "row", gap: 6, marginTop: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 22, backgroundColor: colors.accent },
  footer: { gap: spacing.md, paddingBottom: spacing.md },
  skip: { textAlign: "center", color: colors.textSecondary, fontWeight: "600" },
});
