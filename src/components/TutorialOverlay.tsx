import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";

import AnimatedPressable from "@/components/AnimatedPressable";

const TUTORIAL_KEY = "nusawallet.tutorial-complete";

const STEPS = [
  {
    icon: "🏠",
    title: "Beranda & Saldo",
    desc: "Lihat total saldo ekuivalen, dompet valas, dan transaksi terbaru kamu di sini.",
  },
  {
    icon: "💳",
    title: "Dompet Multi Mata Uang",
    desc: "Kelola USD, SGD, EUR, MYR dalam satu tempat. Konversi antar mata uang dengan kurs real-time.",
  },
  {
    icon: "📥",
    title: "Terima Pembayaran",
    desc: "Buat link pembayaran internasional dan bagikan ke klien. Dilindungi deteksi fraud berbasis AI.",
  },
  {
    icon: "📊",
    title: "Insights & AI",
    desc: "Dapatkan rekomendasi konversi cerdas, analisis tren kurs, dan lindungi nilai tukar kamu.",
  },
  {
    icon: "👤",
    title: "Profil & Keamanan",
    desc: "Atur preferensi akun, notifikasi, dan perangkat. Data kamu dilindungi enkripsi end-to-end.",
  },
];

export async function isTutorialComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TUTORIAL_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function markTutorialComplete() {
  try {
    await AsyncStorage.setItem(TUTORIAL_KEY, "true");
  } catch { /* ignore */ }
}

export function TutorialOverlay({ onComplete }: { onComplete: () => void }) {
  const { width: screenWidth } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const fade = useSharedValue(0);
  const slide = useSharedValue(30);

  useEffect(() => {
    fade.value = 0;
    slide.value = 30;
    fade.value = withTiming(1, { duration: 300 });
    slide.value = withTiming(0, { duration: 300 });
  }, [step]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: slide.value }],
  }));

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  function next() {
    if (isLast) {
      markTutorialComplete().then(onComplete);
    } else {
      setStep(step + 1);
    }
  }

  function skip() {
    markTutorialComplete().then(onComplete);
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          <AnimatedPressable style={s.skipBtn} onPress={skip}>
            <Text style={s.skipText}>Lewati</Text>
          </AnimatedPressable>

          <Animated.View style={[s.content, animStyle]}>
            <View style={s.iconWrap}>
              <Text style={s.icon}>{current.icon}</Text>
            </View>
            <Text style={s.title}>{current.title}</Text>
            <Text style={s.desc}>{current.desc}</Text>
          </Animated.View>

          <View style={s.footer}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={s.dots}>
              {STEPS.map((_, i) => (
                <AnimatedPressable key={i} onPress={() => setStep(i)}>
                  <View style={[s.dot, i === step && s.dotActive]} />
                </AnimatedPressable>
              ))}
            </View>
            <AnimatedPressable style={s.nextBtn} onPress={next}>
              <Text style={s.nextText}>
                {isLast ? "Mulai Pakai NusaWallet" : "Lanjut"}
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(14, 33, 72, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    minHeight: 380,
  },
  skipBtn: {
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: fontSizes.label,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "#E5EDFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 44,
  },
  title: {
    fontSize: fontSizes.h4,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  desc: {
    fontSize: fontSizes.bodyAlt,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  footer: {
    gap: spacing.md,
    alignItems: "center",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.accent,
  },
  nextBtn: {
    width: "100%",
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  nextText: {
    color: "#fff",
    fontSize: fontSizes.h6,
    fontWeight: "700",
  },
});
