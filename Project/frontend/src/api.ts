import axios from "axios";
import type { Comment, Page, Post, PostRequest, User } from "./types";
import type { RecommendationResult, SurveyResult } from "./types/survey";


const API_BASE_URL = "http://localhost:8080/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

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

export const deleteComment = async (token: string, commentId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const login = async (email: string, password: string): Promise<string> => {
  const response = await axios.post<{ token: string }>(`${API_BASE_URL}/auth/login`, {
    email,
    password,
  });
  return response.data.token;
};

export const signup = async (
  email: string,
  password: string,
  nickname: string,
  gender: string,
  birthDate: string
): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/signup`, { email, password, nickname, gender, birthDate, });
};

export const getMyProfile = async (token: string): Promise<User> => {
  const response = await axios.get<User>(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
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

export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  const response = await axios.get<{ available: boolean }>(`${API_BASE_URL}/auth/check-email`, {
    params: { email },
  });
  return response.data.available;
};

export const checkLoginIdAvailability = async (loginId: string): Promise<boolean> => {
  const response = await axios.get<{ available: boolean }>(`${API_BASE_URL}/auth/check-login-id`, {
    params: { loginId },
  });
  return response.data.available;
};
export const getRecommendations = async (token: string): Promise<RecommendationResult[]> => {
  const response = await axios.get<RecommendationResult[]>(`${API_BASE_URL}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};