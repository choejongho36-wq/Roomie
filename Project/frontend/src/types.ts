export interface Post {
  postId: number;
  userId: number;
  nickname: string;
  authorProfileImageUrl: string | null;
  title: string | null;
  region: string;
  budgetMin: number | null;
  budgetMax: number | null;
  moveInDate: string | null;
  moveInMonthMin: number | null;
  moveInMonthMax: number | null;
  roomType: string | null;
  recruitCount: number;
  description: string;
  tags: string | null;
  boardType: string | null;
  status: string;
  viewCount: number;
  bookmarkCount: number;
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface PostRequest {
  title: string | null;
  region: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  moveInDate: string | null;
  moveInMonthMin: number | null;
  moveInMonthMax: number | null;
  roomType: string | null;
  recruitCount: number | null;
  description: string;
  tags: string | null;
  boardType: string | null;
}

export interface Inquiry {
  inquiryId: number;
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  title: string;
  category: string;
  content: string;
  status: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
}

export interface InquiryRequest {
  title: string;
  category: string;
  content: string;
}

export interface Comment {
  commentId: number;
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
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