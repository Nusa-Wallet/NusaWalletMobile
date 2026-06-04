import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { colors } from "@/theme/colors";
import { useAuth } from "@/store/auth";

// Entry gate: route to the app if logged in, otherwise onboarding.
export default function Index() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={token ? "/(tabs)" : "/onboarding"} />;
}
