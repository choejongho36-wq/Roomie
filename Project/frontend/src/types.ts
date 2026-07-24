export interface Post {
  id: number;
  title: string;
  content: string;
  viewCount: number;
  createdAt: string;
}

export interface User {
  loginId: string;
  email: string;
  nickname: string;
  gender: string;
  birthDate: string;
  phone: string;
  createdAt: string;
  profileImageUrl: string | null;
  tags: string[];
  bio: string | null;
}