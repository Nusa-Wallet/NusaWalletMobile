import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/theme/colors";
import { fonts, fontSizes } from "@/theme/typography";
import { scale, scaleFont } from "@/utils/responsive";
import AnimatedPressable from "@/components/AnimatedPressable";

const SLIDES = [
  { icon: "globe-outline", title: "Terima Pembayaran Global", desc: "Terima dana dari klien di seluruh dunia dengan mudah dan cepat." },
  { icon: "wallet-outline", title: "Simpan Multi Mata Uang", desc: "Kelola USD, SGD, EUR, MYR dan lainnya dalam satu dompet digital." },
  { icon: "sparkles-outline", title: "AI Insights & Proteksi", desc: "Dapatkan rekomendasi konversi cerdas dan perlindungan fraud real-time." },
];

export default function Onboarding() {
  const { width: screenWidth } = useWindowDimensions();
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  const iconSize = scale(120, screenWidth);
  const titleFont = scaleFont(fontSizes.h2, screenWidth);

  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);

  function next() {
    if (last) {
      router.replace("/(auth)/login");
    } else {
      setI(i + 1);
    }
  }

  if (!ready) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.logoArea} />
        <View style={s.body}>
          <View style={[s.iconWrap, { width: iconSize, height: iconSize, borderRadius: iconSize * 0.24 }]} />
          <View style={[s.skelTitle, { width: screenWidth * 0.5 }]} />
          <View style={[s.skelDesc, { width: screenWidth * 0.75 }]} />
        </View>
        <View style={s.footer}>
          <View style={s.skelBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.logoArea}>
        <View style={s.logoRow}>
          <Image
            source={require("@/../assets/app-icon.png")}
            style={s.logoImg}
            resizeMode="contain"
          />
          <View>
            <Text style={s.logoTextNusa}>Nusa</Text>
            <Text style={s.logoTextWallet}>Wallet</Text>
          </View>
        </View>
      </View>

      <View style={s.body}>
        <View key={i} style={s.slideContent}>
          <View style={[s.iconWrap, { width: iconSize, height: iconSize, borderRadius: iconSize * 0.24 }]}>
            <Ionicons name={slide.icon as any} size={iconSize * 0.44} color={colors.accent} />
          </View>
          <Text style={[s.title, { fontSize: titleFont }]}>{slide.title}</Text>
          <Text style={s.desc}>{slide.desc}</Text>
        </View>

        <View style={s.dots}>
          {SLIDES.map((_, idx) => (
            <AnimatedPressable key={idx} onPress={() => setI(idx)}>
              <View style={[s.dot, idx === i && s.dotActive]} />
            </AnimatedPressable>
          ))}
        </View>
      </View>

      <View style={s.footer}>
        <AnimatedPressable style={s.btnPrimary} onPress={next}>
          <Text style={s.btnPrimaryText}>{last ? "Mulai Sekarang" : "Lanjut"}</Text>
          <Ionicons name={last ? "sparkles" : "arrow-forward"} size={18} color="#fff" />
        </AnimatedPressable>
        <Link href="/(auth)/login" style={s.skip}>
          <Text style={s.skipText}>Lewati</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  logoArea: { alignItems: "center", paddingTop: spacing.xl },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoImg: { width: 36, height: 36 },
  logoTextNusa: { fontSize: fontSizes.h3, fontFamily: fonts.bold, color: colors.primary },
  logoTextWallet: { fontSize: fontSizes.h3, fontFamily: fonts.bold, color: colors.accent, marginTop: -4 },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  slideContent: { alignItems: "center", gap: spacing.md },
  iconWrap: {
    width: 100, height: 100, borderRadius: 24,
    backgroundColor: `${colors.accent}10`,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { fontSize: fontSizes.h2, fontFamily: fonts.bold, color: colors.textPrimary, textAlign: "center" },
  desc: { fontFamily: fonts.regular, fontSize: fontSizes.body, color: colors.textSecondary, textAlign: "center", lineHeight: 22, paddingHorizontal: spacing.xs },
  dots: { flexDirection: "row", gap: 8, paddingTop: spacing.xl },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.border, opacity: 0.5,
  },
  dotActive: { width: 28, backgroundColor: colors.accent, opacity: 1 },
  footer: { gap: spacing.sm, paddingBottom: spacing.xl },
  btnPrimary: {
    backgroundColor: colors.primary, height: 52,
    borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: spacing.sm,
  },
  btnPrimaryText: { color: "#fff", fontSize: fontSizes.h6, fontFamily: fonts.bold },
  skip: { alignItems: "center", paddingVertical: spacing.sm },
  skipText: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: fontSizes.bodyAlt },
  skelTitle: { height: 24, borderRadius: 6, backgroundColor: colors.border, marginTop: spacing.md },
  skelDesc: { height: 40, borderRadius: 6, backgroundColor: colors.border, marginTop: spacing.sm },
  skelBtn: { height: 54, borderRadius: radius.md, backgroundColor: colors.border, opacity: 0.3 },
});
