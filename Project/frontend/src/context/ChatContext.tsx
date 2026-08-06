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
  const { isConnected, lastMessage, lastNotification, sendMessage } = useChatSocket(token);
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
    refreshChatUnreadCount();
  }, [lastMessage, token, myUserId, refreshChatUnreadCount]);

  // 알림(채팅신청/수락/댓글답글/채팅 등)은 백엔드가 생성 즉시 웹소켓으로 밀어준다 (NotificationService.saveAndPush).
  // 프레임 자체를 바로 상태에 붙이지 않고 다시 목록을 받아오는 이유는 read 여부 등 서버 계산값을 신뢰하기 위함.
  useEffect(() => {
    if (!token || !lastNotification) return;
    getNotifications(token).then(setNotifications).catch(() => {});
  }, [lastNotification, token]);

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
