import { useCallback, useEffect, useRef, useState } from "react";
import { CHAT_WS_URL } from "../api";
import type { ChatMessage, NotificationItem } from "../types/chat";

export function useChatSocket(token: string | null) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
  const [lastNotification, setLastNotification] = useState<NotificationItem | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = new WebSocket(`${CHAT_WS_URL}?token=${encodeURIComponent(token)}`);
    socketRef.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && typeof data.messageId === "number") {
          setLastMessage(data as ChatMessage);
        } else if (data && typeof data.notificationId === "number") {
          setLastNotification(data as NotificationItem);
        }
      } catch {
        // 잘못된 프레임은 무시
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [token]);

  const sendMessage = useCallback((toUserId: number, content: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ toUserId, content }));
    return true;
  }, []);

  return { isConnected, lastMessage, lastNotification, sendMessage };
}
