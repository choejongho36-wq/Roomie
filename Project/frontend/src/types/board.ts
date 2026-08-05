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
  pinned: boolean;
  pinOrder: number | null;
  recommendCount: number;
  recommended: boolean;
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

export interface Comment {
  commentId: number;
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  parentCommentId: number | null;
  content: string;
  deleted: boolean;
  createdAt: string;
}

export interface MyComment {
  commentId: number;
  postId: number;
  postTitle: string | null;
  content: string;
  createdAt: string;
}
