import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { clearNotifications, deleteNotification, getChatUnreadCount, getNotifications } from "../api";
import { useChatSocket } from "../hooks/useChatSocket";
import type { ChatMessage, NotificationItem } from "../types/chat";

interface ChatContextValue {
  isConnected: boolean;
  lastMessage: ChatMessage | null;
  sendMessage: (toUserId: number, content: string) => boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  removeNotification: (notificationId: number) => void;
  clearAllNotifications: () => void;
  chatUnreadCount: number;
  refreshChatUnreadCount: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const { isConnected, lastMessage, sendMessage } = useChatSocket(token);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const myUserId = user?.userId ?? null;

  const refreshChatUnreadCount = useCallback(() => {
    if (!token) return;
    getChatUnreadCount(token).then(setChatUnreadCount).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setChatUnreadCount(0);
      return;
    }
    getNotifications(token).then(setNotifications).catch(() => {});
    refreshChatUnreadCount();
  }, [token, refreshChatUnreadCount]);

  useEffect(() => {
    if (!token || !lastMessage || lastMessage.senderId === myUserId) return;
    getNotifications(token).then(setNotifications).catch(() => {});
    refreshChatUnreadCount();
  }, [lastMessage, token, myUserId, refreshChatUnreadCount]);

  const removeNotification = useCallback(
    (notificationId: number) => {
      if (!token) return;
      setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
      deleteNotification(token, notificationId).catch(() => {});
    },
    [token]
  );

  const clearAllNotifications = useCallback(() => {
    if (!token) return;
    setNotifications([]);
    clearNotifications(token).catch(() => {});
  }, [token]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return (
    <ChatContext.Provider
      value={{
        isConnected,
        lastMessage,
        sendMessage,
        notifications,
        unreadCount,
        removeNotification,
        clearAllNotifications,
        chatUnreadCount,
        refreshChatUnreadCount,
      }}
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
