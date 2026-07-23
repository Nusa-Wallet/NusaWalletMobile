import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, SlideInDown } from "react-native-reanimated";

import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
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
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  const iconSize = scale(100, screenWidth);
  const titleFont = scaleFont(fontSizes.h2, screenWidth);

  function next() {
    if (last) {
      router.replace("/(auth)/login");
    } else {
      setI(i + 1);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <StaggerFadeIn index={0} baseDelay={100}>
        <View style={s.logoArea}>
          <View style={s.logoRow}>
            <View style={s.logoBox}>
              <Ionicons name="wallet" size={22} color="#fff" />
            </View>
            <View>
              <Text style={s.logoTextNusa}>Nusa</Text>
              <Text style={s.logoTextWallet}>Wallet</Text>
            </View>
          </View>
        </View>
      </StaggerFadeIn>

      <View style={s.body}>
        <Animated.View key={i} entering={FadeInDown.duration(300)} style={s.slideContent}>
          <View style={[s.iconWrap, { width: iconSize, height: iconSize, borderRadius: iconSize * 0.24 }]}>
            <Ionicons name={slide.icon as any} size={iconSize * 0.48} color={colors.accent} />
          </View>
          <Text style={[s.title, { fontSize: titleFont }]}>{slide.title}</Text>
          <Text style={s.desc}>{slide.desc}</Text>
        </Animated.View>

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
          <Text style={s.skipText}>Lewati — Saya sudah punya akun</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  logoArea: { alignItems: "center", paddingTop: spacing.xl },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.accent, alignItems: "center", justifyContent: "center",
  },
  logoTextNusa: { fontSize: fontSizes.h3, fontWeight: "800", color: colors.primary },
  logoTextWallet: { fontSize: fontSizes.h3, fontWeight: "800", color: colors.accent, marginTop: -4 },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  slideContent: { alignItems: "center" },
  iconWrap: {
    width: 100, height: 100, borderRadius: 24,
    backgroundColor: `${colors.accent}12`, alignItems: "center", justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { fontSize: fontSizes.h2, fontWeight: "700", color: colors.textPrimary, textAlign: "center" },
  desc: { fontSize: fontSizes.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.md, lineHeight: 22 },
  dots: { flexDirection: "row", gap: 8, marginTop: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.accent },
  footer: { gap: spacing.md, paddingBottom: spacing.xl },
  btnPrimary: {
    backgroundColor: colors.primary, height: 54,
    borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: spacing.sm,
  },
  btnPrimaryText: { color: "#fff", fontSize: fontSizes.h6, fontWeight: "700" },
  skip: { alignItems: "center", paddingVertical: 4 },
  skipText: { color: colors.textSecondary, fontWeight: "500", fontSize: fontSizes.bodyAlt },
});
