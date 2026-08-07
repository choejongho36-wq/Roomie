// 한 글이 여러 게시판에 동시에(중복으로) 고정될 수 있어서, 고정 정보는 단일
// boolean/순서가 아니라 "이 글이 고정된 게시판들" 리스트로 내려온다.
export interface PostPinInfo {
  boardType: string;
  pinOrder: number;
}

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
  pins: PostPinInfo[];
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
