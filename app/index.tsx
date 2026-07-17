import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { colors } from "@/theme/colors";
import { useAuth } from "@/store/auth";

// Entry gate: show onboarding only until the first successful authentication.
export default function Index() {
  const { token, hasOnboarded, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (token) return <Redirect href="/(tabs)" />;
  return <Redirect href={hasOnboarded ? "/(auth)/login" : "/onboarding"} />;
}
