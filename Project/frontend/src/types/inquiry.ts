export interface Inquiry {
  inquiryId: number;
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  title: string;
  category: string;
  content: string | null;
  status: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
  secret: boolean;
}

export interface InquiryRequest {
  title: string;
  category: string;
  content: string;
  secret: boolean;
}
