export interface Post {
  postId: number;
  userId: number;
  nickname: string;
  region: string;
  budgetMin: number | null;
  budgetMax: number | null;
  moveInDate: string | null;
  roomType: string | null;
  recruitCount: number;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface PostRequest {
  region: string;
  budgetMin: number | null;
  budgetMax: number | null;
  moveInDate: string | null;
  roomType: string | null;
  recruitCount: number;
  description: string;
}

export interface Inquiry {
  inquiryId: number;
  userId: number;
  nickname: string;
  title: string;
  content: string;
  status: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
}

export interface InquiryRequest {
  title: string;
  content: string;
}

export interface Comment {
  commentId: number;
  userId: number;
  nickname: string;
  parentCommentId: number | null;
  content: string;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
}

export interface User {
  userId: number;
  email: string;
  nickname: string;
  gender: string;
  birthDate: string;
  createdAt: string;
  profileImageUrl: string | null;
  tags: string[];
  bio: string | null;
}