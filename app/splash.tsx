import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/store/auth";
import { colors } from "@/theme/colors";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";

export const SPLASH_COMPLETE_KEY = "nusawallet.splash-complete";

export default function SplashScreen() {
  const { token, hasOnboarded, loading: authLoading } = useAuth();
  const [decision, setDecision] = useState<"loading" | "show" | "redirect">("loading");
  const tapped = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(SPLASH_COMPLETE_KEY).then((val) => {
      if (val === "true") {
        setDecision("redirect");
      } else {
        setDecision("show");
      }
    }).catch(() => {
      setDecision("show");
    });
  }, []);

  const goNext = useCallback(async () => {
    if (tapped.current) return;
    tapped.current = true;
    await AsyncStorage.setItem(SPLASH_COMPLETE_KEY, "true");
    router.replace("/onboarding");
  }, []);

  if (decision === "loading") {
    return (
      <View style={s.fullArea}>
        <View style={s.body}>
          <View style={[s.skelLogo]} />
          <View style={[s.skelTitle, { width: 160 }]} />
          <View style={[s.skelTagline, { width: 260 }]} />
        </View>
      </View>
    );
  }

  if (decision === "redirect") {
    if (authLoading) return null;
    if (token) return <Redirect href="/(tabs)" />;
    return <Redirect href={hasOnboarded ? "/(auth)/login" : "/onboarding"} />;
  }

  return (
    <Pressable onPress={goNext} style={s.fullArea}>
      <View style={s.body}>
        <StaggerFadeIn index={0} baseDelay={200}>
          <View style={s.logoCol}>
            <Image
              source={require("@/../assets/app-logo.png")}
              style={s.logo}
              resizeMode="contain"
            />
            <Text style={s.title}>NusaWallet</Text>
            <Text style={s.tagline}>
              Kelola pembayaran lintas negara dengan lebih cerdas
            </Text>
          </View>
        </StaggerFadeIn>
      </View>

      <StaggerFadeIn index={1} baseDelay={600}>
        <View style={s.footer}>
          <View style={s.dot} />
          <Text style={s.continueText}>Ketuk untuk melanjutkan</Text>
        </View>
      </StaggerFadeIn>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fullArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logoCol: {
    alignItems: "center",
    gap: 16,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 24,
    fontFamily: "Montserrat_600SemiBold",
    color: "#000000",
    letterSpacing: -0.55,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Montserrat_400Regular",
    color: "rgba(0,0,0,0.6)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
    maxWidth: 320,
  },
  footer: {
    paddingBottom: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000000",
    opacity: 0.77,
  },
  continueText: {
    fontSize: 12,
    fontFamily: "Montserrat_400Regular",
    color: "#000000",
    lineHeight: 16,
  },
  skelLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.border,
    opacity: 0.3,
    marginBottom: 16,
  },
  skelTitle: {
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.border,
    opacity: 0.3,
    marginBottom: 12,
  },
  skelTagline: {
    height: 40,
    borderRadius: 6,
    backgroundColor: colors.border,
    opacity: 0.3,
  },
});
