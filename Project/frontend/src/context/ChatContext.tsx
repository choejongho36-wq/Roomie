import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getNotifications, markNotificationRead } from "../api";
import { useChatSocket } from "../hooks/useChatSocket";
import type { ChatMessage, NotificationItem } from "../types/chat";

interface ChatContextValue {
  isConnected: boolean;
  lastMessage: ChatMessage | null;
  sendMessage: (toUserId: number, content: string) => boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (notificationId: number) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const { isConnected, lastMessage, sendMessage } = useChatSocket(token);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const myUserId = user?.userId ?? null;

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }
    getNotifications(token).then(setNotifications).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token || !lastMessage || lastMessage.senderId === myUserId) return;
    getNotifications(token).then(setNotifications).catch(() => {});
  }, [lastMessage, token, myUserId]);

  const markAsRead = useCallback(
    (notificationId: number) => {
      if (!token) return;
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notificationId ? { ...n, read: true } : n))
      );
      markNotificationRead(token, notificationId).catch(() => {});
    },
    [token]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return (
    <ChatContext.Provider
      value={{ isConnected, lastMessage, sendMessage, notifications, unreadCount, markAsRead }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
