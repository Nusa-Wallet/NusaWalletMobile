import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme/colors";

const SLIDES = [
  { icon: "globe-outline",    title: "Terima Pembayaran Global",  desc: "Terima dana dari klien di seluruh dunia dengan mudah dan cepat." },
  { icon: "wallet-outline",   title: "Simpan Multi Mata Uang",    desc: "Kelola USD, SGD, EUR, MYR dan lainnya dalam satu dompet digital." },
  { icon: "sparkles-outline", title: "AI Insights & Proteksi",    desc: "Dapatkan rekomendasi konversi cerdas dan perlindungan fraud real-time." },
];

// Path to logo — taruh file PNG logo di assets/images/logo.png
let LogoImage: any = null;
try { LogoImage = require("../assets/images/logo.png"); } catch { LogoImage = null; }

export default function Onboarding() {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  return (
    <SafeAreaView style={s.container}>
      {/* Brand logo at top */}
      <View style={s.logoArea}>
        {LogoImage ? (
          <Image source={LogoImage} style={s.logoImg} resizeMode="contain" />
        ) : (
          <View style={s.logoFallback}>
            <View style={s.logoBox}>
              <Ionicons name="wallet" size={26} color="#fff" />
            </View>
            <View>
              <Text style={s.logoTextNusa}>Nusa</Text>
              <Text style={s.logoTextWallet}>Wallet</Text>
            </View>
          </View>
        )}
      </View>

      {/* Slide content */}
      <View style={s.body}>
        <View style={s.iconWrap}>
          <Ionicons name={slide.icon as any} size={52} color={colors.accent} />
        </View>
        <Text style={s.title}>{slide.title}</Text>
        <Text style={s.desc}>{slide.desc}</Text>
        <View style={s.dots}>
          {SLIDES.map((_, idx) => (
            <View key={idx} style={[s.dot, idx === i && s.dotActive]} />
          ))}
        </View>
      </View>

      {/* Footer actions */}
      <View style={s.footer}>
        <TouchableOpacity
          style={s.btnPrimary}
          onPress={() => (last ? router.replace("/(auth)/login") : setI(i + 1))}
        >
          <Text style={s.btnPrimaryText}>{last ? "Mulai Sekarang" : "Lanjut"}</Text>
        </TouchableOpacity>
        <Link href="/(auth)/login" style={s.skip}>Masuk</Link>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  logoArea: { alignItems: "center", paddingTop: spacing.lg },
  logoImg: { width: 180, height: 48 },
  logoFallback: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.accent, alignItems: "center", justifyContent: "center",
  },
  logoTextNusa: { fontSize: 22, fontWeight: "800", color: colors.primary },
  logoTextWallet: { fontSize: 22, fontWeight: "800", color: colors.accent, marginTop: -4 },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 110, height: 110, borderRadius: 28,
    backgroundColor: "#E5EDFB", alignItems: "center", justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.textPrimary, textAlign: "center" },
  desc: { fontSize: 15, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.md },
  dots: { flexDirection: "row", gap: 6, marginTop: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 22, backgroundColor: colors.accent },
  footer: { gap: spacing.md, paddingBottom: spacing.lg },
  btnPrimary: {
    backgroundColor: colors.primary, height: 52,
    borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  skip: { textAlign: "center", color: colors.textSecondary, fontWeight: "600" },
});
