import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";

import { AppNotification, useNotifications } from "@/store/notifications";
import { colors, radius, spacing } from "@/theme/colors";
import { AnimPressable } from "./AnimPressable";

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  transaction: "swap-horizontal-outline",
  rate_alert: "trending-up-outline",
  fraud_alert: "shield-outline",
  system: "settings-outline",
};

const TIME_STR = (ts: number) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  const days = Math.floor(hrs / 24);
  return `${days}h lalu`;
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationPanel({ visible, onClose }: Props) {
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Animated.View
          style={[
            s.panel,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
              opacity: slideAnim,
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={s.panelInner}>
              {/* Header */}
              <View style={s.header}>
                <Text style={s.headerTitle}>Notifikasi</Text>
                <View style={s.headerRight}>
                  {unreadCount > 0 && (
                    <AnimPressable onPress={markAllRead}>
                      <Text style={s.markAllText}>Baca semua</Text>
                    </AnimPressable>
                  )}
                  <AnimPressable onPress={onClose}>
                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                  </AnimPressable>
                </View>
              </View>

              {/* Badge summary */}
              {unreadCount > 0 && (
                <View style={s.summaryBar}>
                  <View style={s.summaryDot} />
                  <Text style={s.summaryText}>{unreadCount} belum dibaca</Text>
                </View>
              )}

              {/* List */}
              <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <View style={s.empty}>
                    <View style={s.emptyIcon}>
                      <Ionicons name="notifications-off-outline" size={28} color={colors.border} />
                    </View>
                    <Text style={s.emptyTitle}>Belum ada notifikasi</Text>
                    <Text style={s.emptyDesc}>Notifikasi akan muncul di sini saat ada aktivitas.</Text>
                  </View>
                ) : (
                  notifications.map((n) => (
                    <NotifRow key={n.id} notif={n} onRead={markRead} onDismiss={dismiss} />
                  ))
                )}
              </ScrollView>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function NotifRow({
  notif,
  onRead,
  onDismiss,
}: {
  notif: AppNotification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <AnimPressable
      style={[s.notifRow, !notif.read && s.notifUnread]}
      onPress={() => onRead(notif.id)}
    >
      <View style={[s.notifIcon, !notif.read && s.notifIconUnread]}>
        <Ionicons
          name={ICON_MAP[notif.type] ?? "notifications-outline"}
          size={18}
          color={!notif.read ? colors.accent : colors.textSecondary}
        />
      </View>
      <View style={s.notifContent}>
        <Text style={[s.notifTitle, !notif.read && s.notifTitleUnread]}>{notif.title}</Text>
        <Text style={s.notifBody} numberOfLines={2}>{notif.body}</Text>
        <Text style={s.notifTime}>{TIME_STR(notif.timestamp)}</Text>
      </View>
      <AnimPressable onPress={() => onDismiss(notif.id)} hitSlop={8}>
        <Ionicons name="close-outline" size={16} color={colors.textSecondary} />
      </AnimPressable>
    </AnimPressable>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start", paddingTop: 60,
  },
  panel: {
    marginHorizontal: spacing.md,
    maxHeight: "80%",
    backgroundColor: colors.card, borderRadius: radius.xl,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24,
  },
  panelInner: { maxHeight: "100%" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  markAllText: { fontSize: 13, color: colors.accent, fontWeight: "600" },
  summaryBar: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: "#EFF6FF",
  },
  summaryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  summaryText: { fontSize: 12, color: colors.accent, fontWeight: "600" },
  list: { maxHeight: 400 },
  empty: { alignItems: "center", paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  emptyIcon: { marginBottom: spacing.md },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },
  notifRow: {
    flexDirection: "row", alignItems: "flex-start", gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  notifUnread: { backgroundColor: "#F8FAFF" },
  notifIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.background, alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  notifIconUnread: { backgroundColor: "#EFF6FF" },
  notifContent: { flex: 1, gap: 2 },
  notifTitle: { fontSize: 14, fontWeight: "500", color: colors.textSecondary },
  notifTitleUnread: { fontWeight: "700", color: colors.textPrimary },
  notifBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  notifTime: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
});
