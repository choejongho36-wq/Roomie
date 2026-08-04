import axios from "axios";
import type { Comment, MyComment, Post, PostRequest } from "./types/board";
import type { Inquiry, InquiryRequest } from "./types/inquiry";
import type { Page } from "./types/common";
import type { User } from "./types/user";
import type {
  RecommendationResult,
  SurveyComparisonExplanationResult,
  SurveyComparisonResult,
  SurveyResult,
  SurveySummaryResult,
} from "./types/survey";
import type { ChatMessage, Conversation, NotificationItem } from "./types/chat";
import type { MatchedPair } from "./types/matchedPair";

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");
export const CHAT_WS_URL = `${API_ORIGIN.replace(/^http/, "ws")}/ws/chat`;

export const getPosts = async (page: number): Promise<Page<Post>> => {
  const response = await axios.get<Page<Post>>(`${API_BASE_URL}/posts`, { params: { page } });
  return response.data;
};

export const getPost = async (postId: number, token?: string | null): Promise<Post> => {
  const response = await axios.get<Post>(`${API_BASE_URL}/posts/${postId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
};

export const createPost = async (token: string, request: PostRequest): Promise<Post> => {
  const response = await axios.post<Post>(`${API_BASE_URL}/posts`, request, authHeader(token));
  return response.data;
};

export const updatePost = async (token: string, postId: number, request: PostRequest): Promise<Post> => {
  const response = await axios.put<Post>(`${API_BASE_URL}/posts/${postId}`, request, authHeader(token));
  return response.data;
};

export const deletePost = async (token: string, postId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/posts/${postId}`, authHeader(token));
};

export const getBookmarkedPosts = async (token: string): Promise<Post[]> => {
  const response = await axios.get<Post[]>(`${API_BASE_URL}/posts/bookmarked`, authHeader(token));
  return response.data;
};

export const getMyPosts = async (token: string): Promise<Post[]> => {
  const response = await axios.get<Post[]>(`${API_BASE_URL}/posts/mine`, authHeader(token));
  return response.data;
};

export const getMyComments = async (token: string): Promise<MyComment[]> => {
  const response = await axios.get<MyComment[]>(`${API_BASE_URL}/comments/mine`, authHeader(token));
  return response.data;
};

export const toggleBookmark = async (token: string, postId: number): Promise<Post> => {
  const response = await axios.post<Post>(
    `${API_BASE_URL}/posts/${postId}/bookmark`,
    {},
    authHeader(token)
  );
  return response.data;
};

export const reportPost = async (token: string, postId: number, reason: string): Promise<void> => {
  await axios.post(
    `${API_BASE_URL}/posts/${postId}/report`,
    { reason },
    authHeader(token)
  );
};

export const getComments = async (postId: number): Promise<Comment[]> => {
  const response = await axios.get<Comment[]>(`${API_BASE_URL}/posts/${postId}/comments`);
  return response.data;
};

export const createComment = async (
  token: string,
  postId: number,
  content: string,
  parentCommentId: number | null
): Promise<Comment> => {
  const response = await axios.post<Comment>(
    `${API_BASE_URL}/posts/${postId}/comments`,
    { content, parentCommentId },
    authHeader(token)
  );
  return response.data;
};

export const updateComment = async (token: string, commentId: number, content: string): Promise<Comment> => {
  const response = await axios.put<Comment>(
    `${API_BASE_URL}/comments/${commentId}`,
    { content },
    authHeader(token)
  );
  return response.data;
};

export const deleteComment = async (token: string, commentId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/comments/${commentId}`, authHeader(token));
};

export const getInquiries = async (token: string): Promise<Inquiry[]> => {
  const response = await axios.get<Inquiry[]>(`${API_BASE_URL}/inquiries`, authHeader(token));
  return response.data;
};

export const getInquiry = async (token: string, inquiryId: number): Promise<Inquiry> => {
  const response = await axios.get<Inquiry>(`${API_BASE_URL}/inquiries/${inquiryId}`, authHeader(token));
  return response.data;
};

export const createInquiry = async (token: string, request: InquiryRequest): Promise<Inquiry> => {
  const response = await axios.post<Inquiry>(`${API_BASE_URL}/inquiries`, request, authHeader(token));
  return response.data;
};

export const updateInquiry = async (
  token: string,
  inquiryId: number,
  request: InquiryRequest
): Promise<Inquiry> => {
  const response = await axios.put<Inquiry>(`${API_BASE_URL}/inquiries/${inquiryId}`, request, authHeader(token));
  return response.data;
};

export const deleteInquiry = async (token: string, inquiryId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/inquiries/${inquiryId}`, authHeader(token));
};

export const answerInquiry = async (token: string, inquiryId: number, answer: string): Promise<Inquiry> => {
  const response = await axios.post<Inquiry>(
    `${API_BASE_URL}/inquiries/${inquiryId}/answer`,
    { answer },
    authHeader(token)
  );
  return response.data;
};

export const deleteInquiryAnswer = async (token: string, inquiryId: number): Promise<Inquiry> => {
  const response = await axios.delete<Inquiry>(`${API_BASE_URL}/inquiries/${inquiryId}/answer`, authHeader(token));
  return response.data;
};

export const login = async (loginId: string, password: string): Promise<string> => {
  const response = await axios.post<{ token: string }>(`${API_BASE_URL}/auth/login`, {
    loginId,
    password,
  });
  return response.data.token;
};

export const signup = async (
  loginId: string,
  email: string,
  password: string,
  nickname: string,
  gender: string,
  birthDate: string,
  phone: string,
  region: string,
  job: string
): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/signup`, {
    loginId, email, password, nickname,
    gender, birthDate, phone, region, job,
  });
};

export const getMyProfile = async (token: string): Promise<User> => {
  const response = await axios.get<User>(`${API_BASE_URL}/users/me`, authHeader(token));
  return response.data;
};

export const completeAdditionalInfo = async (
  token: string,
  gender: string,
  birthDate: string,
  phone: string,
  region: string,
  job: string
): Promise<User> => {
  const response = await axios.put<User>(
    `${API_BASE_URL}/users/me/additional-info`,
    { gender, birthDate, phone: phone || null, region, job },
    authHeader(token)
  );
  return response.data;
};

export const uploadProfileImage = async (token: string, file: File): Promise<User> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post<User>(`${API_BASE_URL}/users/me/profile-image`, formData, authHeader(token));
  return response.data;
};

export const deleteProfileImage = async (token: string): Promise<User> => {
  const response = await axios.delete<User>(`${API_BASE_URL}/users/me/profile-image`, authHeader(token));
  return response.data;
};

export const updateTags = async (token: string, tags: string[]): Promise<User> => {
  const response = await axios.put<User>(
    `${API_BASE_URL}/users/me/tags`,
    { tags },
    authHeader(token)
  );
  return response.data;
};

export const updateBio = async (token: string, bio: string): Promise<User> => {
  const response = await axios.put<User>(
    `${API_BASE_URL}/users/me/bio`,
    { bio },
    authHeader(token)
  );
  return response.data;
};

export const updateNickname = async (token: string, nickname: string): Promise<User> => {
  const response = await axios.put<User>(
    `${API_BASE_URL}/users/me/nickname`,
    { nickname },
    authHeader(token)
  );
  return response.data;
};

export const changePassword = async (
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<User> => {
  const response = await axios.put<User>(
    `${API_BASE_URL}/users/me/password`,
    { currentPassword, newPassword },
    authHeader(token)
  );
  return response.data;
};

export const submitSurvey = async (token: string, answers: number[]): Promise<SurveyResult> => {
  const response = await axios.post<SurveyResult>(
    `${API_BASE_URL}/surveys`,
    { answers },
    authHeader(token)
  );
  return response.data;
};

export const getMySurveys = async (token: string): Promise<SurveyResult[]> => {
  const response = await axios.get<SurveyResult[]>(`${API_BASE_URL}/surveys/me`, authHeader(token));
  return response.data;
};

export const getMySurveySummary = async (token: string): Promise<SurveySummaryResult> => {
  const response = await axios.get<SurveySummaryResult>(`${API_BASE_URL}/surveys/me/summary`, authHeader(token));
  return response.data;
};

// 설문 완료 후 가중치 설정 화면에서 기존 저장값을 불러올 때 사용. 문항 id -> 가중치(1~3)
export const getCategoryWeights = async (token: string): Promise<Record<number, number>> => {
  const response = await axios.get<Record<number, number>>(`${API_BASE_URL}/users/me/category-weights`, authHeader(token));
  return response.data;
};

export const saveCategoryWeights = async (token: string, weights: Record<number, number>): Promise<void> => {
  await axios.put(`${API_BASE_URL}/users/me/category-weights`, weights, authHeader(token));
};

export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  const response = await axios.get<{ available: boolean }>(`${API_BASE_URL}/auth/check-email`, {
    params: { email },
  });
  return response.data.available;
};

export const requestEmailVerification = async (email: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/email/verify-request`, { email });
};

export const confirmEmailVerification = async (email: string, code: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/email/verify-confirm`, { email, code });
};

export const checkLoginIdAvailability = async (loginId: string): Promise<boolean> => {
  const response = await axios.get<{ available: boolean }>(`${API_BASE_URL}/auth/check-login-id`, {
    params: { loginId },
  });
  return response.data.available;
};

export const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
  const response = await axios.get<{ available: boolean }>(`${API_BASE_URL}/auth/check-nickname`, {
    params: { nickname },
  });
  return response.data.available;
};

export const getRecommendations = async (token: string): Promise<RecommendationResult[]> => {
  const response = await axios.get<RecommendationResult[]>(`${API_BASE_URL}/recommendations`, authHeader(token));
  return response.data;
};

export const getSurveyComparison = async (
  token: string,
  userId: number
): Promise<SurveyComparisonResult> => {
  const response = await axios.get<SurveyComparisonResult>(
    `${API_BASE_URL}/recommendations/${userId}/comparison`,
    authHeader(token)
  );
  return response.data;
};

export const getSurveyComparisonAiExplanation = async (
  token: string,
  userId: number
): Promise<SurveyComparisonExplanationResult> => {
  const response = await axios.get<SurveyComparisonExplanationResult>(
    `${API_BASE_URL}/recommendations/${userId}/comparison/ai-explanation`,
    authHeader(token)
  );
  return response.data;
};

export const getConversations = async (token: string): Promise<Conversation[]> => {
  const response = await axios.get<Conversation[]>(`${API_BASE_URL}/chat/conversations`, authHeader(token));
  return response.data;
};

export const getChatMessages = async (token: string, otherUserId: number): Promise<ChatMessage[]> => {
  const response = await axios.get<ChatMessage[]>(`${API_BASE_URL}/chat/${otherUserId}/messages`, authHeader(token));
  return response.data;
};

export const getChatUnreadCount = async (token: string): Promise<number> => {
  const response = await axios.get<{ count: number }>(`${API_BASE_URL}/chat/unread-count`, authHeader(token));
  return response.data.count;
};

export const getChatStatus = async (token: string, otherUserId: number): Promise<{ leftByPartner: boolean }> => {
  const response = await axios.get<{ leftByPartner: boolean }>(`${API_BASE_URL}/chat/${otherUserId}/status`, authHeader(token));
  return response.data;
};

export const leaveChat = async (token: string, otherUserId: number): Promise<void> => {
  await axios.post(`${API_BASE_URL}/chat/${otherUserId}/leave`, null, authHeader(token));
};

export const getNotifications = async (token: string): Promise<NotificationItem[]> => {
  const response = await axios.get<NotificationItem[]>(`${API_BASE_URL}/notifications`, authHeader(token));
  return response.data;
};

export const markNotificationRead = async (token: string, notificationId: number): Promise<void> => {
  await axios.patch(`${API_BASE_URL}/notifications/${notificationId}/read`, null, authHeader(token));
};

export const deleteNotification = async (token: string, notificationId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, authHeader(token));
};

export const clearNotifications = async (token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/notifications`, authHeader(token));
};

// 채팅방에서 "룸메이트 확정" 버튼을 누르면 호출 (이미 있으면 기존 페어를 그대로 돌려줌)
export const createOrGetMatchedPair = async (token: string, partnerUserId: number): Promise<MatchedPair> => {
  const response = await axios.post<MatchedPair>(
    `${API_BASE_URL}/matched-pairs`,
    { partnerUserId },
    authHeader(token)
  );
  return response.data;
};

export const getMatchedPair = async (token: string, pairId: number): Promise<MatchedPair> => {
  const response = await axios.get<MatchedPair>(`${API_BASE_URL}/matched-pairs/${pairId}`, authHeader(token));
  return response.data;
};

export const updateMatchedPairConditions = async (
  token: string,
  pairId: number,
  conditions: { region: string | null; depositMax: number | null; monthlyRentMax: number | null }
): Promise<MatchedPair> => {
  const response = await axios.put<MatchedPair>(
    `${API_BASE_URL}/matched-pairs/${pairId}/conditions`,
    conditions,
    authHeader(token)
  );
  return response.data;
};

// "방을 구하셨나요?" -> 하우스로 이동 버튼을 누르면 호출해서 페어를 CONFIRMED로 바꿈
export const confirmMatchedPair = async (token: string, pairId: number): Promise<MatchedPair> => {
  const response = await axios.put<MatchedPair>(
    `${API_BASE_URL}/matched-pairs/${pairId}/confirm`,
    null,
    authHeader(token)
  );
  return response.data;
};

// 네비바 "하우스" 메뉴 클릭 시 내가 확정한 하우스를 찾을 때 사용 (없으면 400)
export const getMyConfirmedHouse = async (token: string): Promise<MatchedPair> => {
  const response = await axios.get<MatchedPair>(`${API_BASE_URL}/matched-pairs/me/confirmed`, authHeader(token));
  return response.data;
};

// ===== 아이디 찾기 =====

export const requestFindId = async (email: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/find-id/request`, { email });
};

// 인증번호 확인은 confirmEmailVerification()을 그대로 재사용

export const getFindIdResult = async (email: string): Promise<string> => {
  const response = await axios.get<{ loginId: string }>(`${API_BASE_URL}/auth/find-id/result`, {
    params: { email },
  });
  return response.data.loginId;
};

// ===== 비밀번호 재설정 =====

export const requestPasswordReset = async (loginId: string, email: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/password/reset-request`, { loginId, email });
};

export const resetPassword = async (loginId: string, email: string, newPassword: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/password/reset`, { loginId, email, newPassword });
};

// ===== 회원탈퇴 =====

export const withdraw = async (token: string, password: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/users/me`, {
    data: { password },
    ...authHeader(token),
  });
};