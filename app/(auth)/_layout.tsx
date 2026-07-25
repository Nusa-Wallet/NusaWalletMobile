import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/store/auth";

export default function AuthLayout() {
  const { token, loading } = useAuth();

  if (loading) return null;
  if (token) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
