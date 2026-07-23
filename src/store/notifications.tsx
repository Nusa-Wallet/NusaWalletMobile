import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const NOTIF_KEY = "nusawallet.notifications";
const NOTIF_SEEN_KEY = "nusawallet.notifications-seen";

export type NotificationType = "transaction" | "rate_alert" | "fraud_alert" | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon: string;
  timestamp: number;
  read: boolean;
  data?: Record<string, any>;
}

type NotifContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  addNotification: (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  refreshFromStorage: () => Promise<void>;
};

const NotifContext = createContext<NotifContextType | undefined>(undefined);

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const persist = useCallback(async (notifs: AppNotification[]) => {
    try {
      await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
    } catch { /* ignore */ }
  }, []);

  const refreshFromStorage = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(NOTIF_KEY);
      if (raw) {
        const parsed: AppNotification[] = JSON.parse(raw);
        setNotifications(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { refreshFromStorage(); }, [refreshFromStorage]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function addNotification(notif: Omit<AppNotification, "id" | "timestamp" | "read">) {
    const newNotif: AppNotification = {
      ...notif,
      id: generateId(),
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev].slice(0, 50);
      persist(updated);
      return updated;
    });
  }

  function markRead(id: string) {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persist(updated);
      return updated;
    });
  }

  function markAllRead() {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persist(updated);
      return updated;
    });
  }

  function dismiss(id: string) {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      persist(updated);
      return updated;
    });
  }

  return (
    <NotifContext.Provider
      value={{ notifications, unreadCount, markRead, markAllRead, dismiss, addNotification, refreshFromStorage }}
    >
      {children}
    </NotifContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
