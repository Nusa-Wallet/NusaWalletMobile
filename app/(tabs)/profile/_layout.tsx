import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="security" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="devices" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="help" />
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}
