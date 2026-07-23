import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
import AnimatedPressable from "@/components/AnimatedPressable";

interface SubScreenHeaderProps {
  title: string;
}

export function SubScreenHeader({ title }: SubScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </AnimatedPressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator, backgroundColor: colors.card,
  },
  backBtn: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  headerTitle: { fontSize: fontSizes.h6, fontWeight: "700", color: colors.textPrimary },
});
