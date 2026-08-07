export interface ChatMessage {
  messageId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}

export interface Conversation {
  partnerId: number;
  partnerNickname: string;
  partnerProfileImageUrl: string | null;
  partnerVerified: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface NotificationItem {
  notificationId: number;
  senderId: number;
  senderNickname: string;
  senderProfileImageUrl: string | null;
  content: string;
  type: string;
  targetId: number | null;
  read: boolean;
  createdAt: string;
}
