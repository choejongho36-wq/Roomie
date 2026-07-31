import axios from "axios";
import type { Comment, Inquiry, InquiryRequest, Page, Post, PostRequest, User } from "./types";
import type {
  RecommendationResult,
  SurveyComparisonExplanationResult,
  SurveyComparisonResult,
  SurveyResult,
  SurveySummaryResult,
} from "./types/survey";
import type { ChatMessage, Conversation, NotificationItem } from "./types/chat";
import type { MatchedPair } from "./types/matchedPair";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");
export const CHAT_WS_URL = `${API_ORIGIN.replace(/^http/, "ws")}/ws/chat`;

export const getPosts = async (page: number): Promise<Page<Post>> => {
  const response = await axios.get<Page<Post>>(`${API_BASE_URL}/posts`, { params: { page } });
  return response.data;
};

export const getPost = async (postId: number): Promise<Post> => {
  const response = await axios.get<Post>(`${API_BASE_URL}/posts/${postId}`);
  return response.data;
};

export const createPost = async (token: string, request: PostRequest): Promise<Post> => {
  const response = await axios.post<Post>(`${API_BASE_URL}/posts`, request, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updatePost = async (token: string, postId: number, request: PostRequest): Promise<Post> => {
  const response = await axios.put<Post>(`${API_BASE_URL}/posts/${postId}`, request, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deletePost = async (token: string, postId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/posts/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getBookmarkedPosts = async (token: string): Promise<Post[]> => {
  const response = await axios.get<Post[]>(`${API_BASE_URL}/posts/bookmarked`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const toggleBookmark = async (token: string, postId: number): Promise<Post> => {
  const response = await axios.post<Post>(
    `${API_BASE_URL}/posts/${postId}/bookmark`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
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
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const updateComment = async (token: string, commentId: number, content: string): Promise<Comment> => {
  const response = await axios.put<Comment>(
    `${API_BASE_URL}/comments/${commentId}`,
    { content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const deleteComment = async (token: string, commentId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getInquiries = async (token: string): Promise<Inquiry[]> => {
  const response = await axios.get<Inquiry[]>(`${API_BASE_URL}/inquiries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getInquiry = async (token: string, inquiryId: number): Promise<Inquiry> => {
  const response = await axios.get<Inquiry>(`${API_BASE_URL}/inquiries/${inquiryId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createInquiry = async (token: string, request: InquiryRequest): Promise<Inquiry> => {
  const response = await axios.post<Inquiry>(`${API_BASE_URL}/inquiries`, request, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateInquiry = async (
  token: string,
  inquiryId: number,
  request: InquiryRequest
): Promise<Inquiry> => {
  const response = await axios.put<Inquiry>(`${API_BASE_URL}/inquiries/${inquiryId}`, request, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteInquiry = async (token: string, inquiryId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/inquiries/${inquiryId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
  const response = await axios.get<User>(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const completeAdditionalInfo = async (
  token: string,
  gender: string,
  birthDate: string,
  phone: string
): Promise<User> => {
  const response = await axios.put<User>(
    `${API_BASE_URL}/users/me/additional-info`,
    { gender, birthDate, phone: phone || null },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const uploadProfileImage = async (token: string, file: File): Promise<User> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post<User>(`${API_BASE_URL}/users/me/profile-image`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteProfileImage = async (token: string): Promise<User> => {
  const response = await axios.delete<User>(`${API_BASE_URL}/users/me/profile-image`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateTags = async (token: string, tags: string[]): Promise<User> => {
  const response = await axios.put<User>(
    `${API_BASE_URL}/users/me/tags`,
    { tags },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const updateBio = async (token: string, bio: string): Promise<User> => {
  const response = await axios.put<User>(
    `${API_BASE_URL}/users/me/bio`,
    { bio },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const updateNickname = async (token: string, nickname: string): Promise<User> => {
  const response = await axios.put<User>(
    `${API_BASE_URL}/users/me/nickname`,
    { nickname },
    { headers: { Authorization: `Bearer ${token}` } }
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
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const submitSurvey = async (token: string, answers: number[]): Promise<SurveyResult> => {
  const response = await axios.post<SurveyResult>(
    `${API_BASE_URL}/surveys`,
    { answers },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getMySurveys = async (token: string): Promise<SurveyResult[]> => {
  const response = await axios.get<SurveyResult[]>(`${API_BASE_URL}/surveys/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getMySurveySummary = async (token: string): Promise<SurveySummaryResult> => {
  const response = await axios.get<SurveySummaryResult>(`${API_BASE_URL}/surveys/me/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
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
  const response = await axios.get<RecommendationResult[]>(`${API_BASE_URL}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getSurveyComparison = async (
  token: string,
  userId: number
): Promise<SurveyComparisonResult> => {
  const response = await axios.get<SurveyComparisonResult>(
    `${API_BASE_URL}/recommendations/${userId}/comparison`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getSurveyComparisonAiExplanation = async (
  token: string,
  userId: number
): Promise<SurveyComparisonExplanationResult> => {
  const response = await axios.get<SurveyComparisonExplanationResult>(
    `${API_BASE_URL}/recommendations/${userId}/comparison/ai-explanation`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getConversations = async (token: string): Promise<Conversation[]> => {
  const response = await axios.get<Conversation[]>(`${API_BASE_URL}/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getChatMessages = async (token: string, otherUserId: number): Promise<ChatMessage[]> => {
  const response = await axios.get<ChatMessage[]>(`${API_BASE_URL}/chat/${otherUserId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getChatUnreadCount = async (token: string): Promise<number> => {
  const response = await axios.get<{ count: number }>(`${API_BASE_URL}/chat/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.count;
};

export const getChatStatus = async (token: string, otherUserId: number): Promise<{ leftByPartner: boolean }> => {
  const response = await axios.get<{ leftByPartner: boolean }>(`${API_BASE_URL}/chat/${otherUserId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const leaveChat = async (token: string, otherUserId: number): Promise<void> => {
  await axios.post(`${API_BASE_URL}/chat/${otherUserId}/leave`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getNotifications = async (token: string): Promise<NotificationItem[]> => {
  const response = await axios.get<NotificationItem[]>(`${API_BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const markNotificationRead = async (token: string, notificationId: number): Promise<void> => {
  await axios.patch(`${API_BASE_URL}/notifications/${notificationId}/read`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteNotification = async (token: string, notificationId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const clearNotifications = async (token: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 채팅방에서 "룸메이트 확정" 버튼을 누르면 호출 (이미 있으면 기존 페어를 그대로 돌려줌)
export const createOrGetMatchedPair = async (token: string, partnerUserId: number): Promise<MatchedPair> => {
  const response = await axios.post<MatchedPair>(
    `${API_BASE_URL}/matched-pairs`,
    { partnerUserId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getMatchedPair = async (token: string, pairId: number): Promise<MatchedPair> => {
  const response = await axios.get<MatchedPair>(`${API_BASE_URL}/matched-pairs/${pairId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
    { headers: { Authorization: `Bearer ${token}` } }
  );
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
    headers: { Authorization: `Bearer ${token}` },
  });
};