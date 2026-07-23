import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
import AnimatedPressable from "@/components/AnimatedPressable";

interface FormFieldProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  error?: boolean;
  rightElement?: React.ReactNode;
}

export function FormField({ icon, error, rightElement, style, ...props }: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.wrap, focused && s.wrapFocused, error && s.wrapError]}>
      <Ionicons name={icon} size={18} color={focused ? colors.accent : colors.textSecondary} style={s.icon} />
      <TextInput
        style={[s.input, style]}
        placeholderTextColor={colors.textSecondary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {rightElement}
    </View>
  );
}

export function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <AnimatedPressable onPress={onToggle} style={s.eyeBtn}>
      <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textSecondary} />
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginBottom: spacing.sm,
  },
  wrapFocused: { borderColor: colors.accent, borderWidth: 1.5 },
  wrapError: { borderColor: colors.danger, borderWidth: 1.5, backgroundColor: "#FFF7F7" },
  icon: { paddingLeft: spacing.md },
  input: {
    flex: 1, height: 52,
    paddingHorizontal: spacing.sm,
    color: colors.textPrimary, fontSize: fontSizes.body,
  },
  eyeBtn: { paddingHorizontal: spacing.md, height: 52, justifyContent: "center" },
});
