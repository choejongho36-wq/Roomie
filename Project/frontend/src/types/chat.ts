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
  lastMessage: string;
  lastMessageAt: string;
}

export interface UserSearchResult {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
}
