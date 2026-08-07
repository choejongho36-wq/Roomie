import { useCallback, useEffect, useRef, useState } from "react";
import { CHAT_WS_URL } from "../api";
import type { ChatMessage, NotificationItem } from "../types/chat";
import type { MatchedPair } from "../types/matchedPair";

export function useChatSocket(token: string | null) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
  const [lastNotification, setLastNotification] = useState<NotificationItem | null>(null);
  const [lastMatchedPairUpdate, setLastMatchedPairUpdate] = useState<MatchedPair | null>(null);

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
        } else if (data && typeof data.myConfirmed === "boolean" && typeof data.partnerConfirmed === "boolean") {
          // 룸메이트 확정(MatchedPair) 실시간 갱신 — 확정 현황 페이지/채팅 페이지가 폴링 없이 즉시 반영함
          setLastMatchedPairUpdate(data as MatchedPair);
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

  return { isConnected, lastMessage, lastNotification, lastMatchedPairUpdate, sendMessage };
}
