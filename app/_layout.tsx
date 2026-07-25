import { useEffect, useRef } from "react";

import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/store/auth";
import { NotificationProvider } from "@/store/notifications";
import { colors } from "@/theme/colors";

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const everLoaded = useRef(false);
  if (loaded) everLoaded.current = true;

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error && !everLoaded.current) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/register" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}