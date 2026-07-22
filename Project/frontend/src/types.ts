export interface Post {
  id: number;
  title: string;
  content: string;
  viewCount: number;
  createdAt: string;
}

export interface User {
  email: string;
  nickname: string;
}