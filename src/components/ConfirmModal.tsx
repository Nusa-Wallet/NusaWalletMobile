import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  detail,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.overlay} onPress={onCancel}>
        <Pressable style={s.content}>
          <View style={s.iconWrap}>
            <Text style={s.icon}>🔒</Text>
          </View>
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>
          {detail && <Text style={s.detail}>{detail}</Text>}
          <View style={s.actions}>
            <Pressable style={s.btnCancel} onPress={onCancel} disabled={loading}>
              <Text style={s.btnCancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable style={s.btnConfirm} onPress={onConfirm} disabled={loading}>
              <Text style={s.btnConfirmText}>{loading ? "Memproses..." : confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  content: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.accent}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  icon: { fontSize: 24 },
  title: {
    fontSize: fontSizes.h5,
    fontFamily: "Montserrat_700Bold",
    color: colors.textPrimary,
    textAlign: "center",
  },
  message: {
    fontSize: fontSizes.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  detail: {
    fontSize: fontSizes.bodyAlt,
    fontFamily: "Montserrat_700Bold",
    color: colors.textPrimary,
    textAlign: "center",
    backgroundColor: `${colors.accent}08`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignSelf: "stretch",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: "stretch",
  },
  btnCancel: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelText: {
    fontSize: fontSizes.body,
    fontFamily: "Montserrat_600SemiBold",
    color: colors.textSecondary,
  },
  btnConfirm: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  btnConfirmText: {
    fontSize: fontSizes.body,
    fontFamily: "Montserrat_700Bold",
    color: "#fff",
  },
});
