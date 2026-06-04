import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { colors, radius, spacing } from "@/theme/colors";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "outline";
  loading?: boolean;
  style?: ViewStyle;
}) {
  const isOutline = variant === "outline";
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[styles.btn, isOutline ? styles.btnOutline : styles.btnPrimary, style]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : "#fff"} />
      ) : (
        <Text style={[styles.btnText, isOutline && { color: colors.primary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnOutline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
});
