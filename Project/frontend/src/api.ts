import axios from "axios";
import type { Post, User } from "./types";
import type { SurveyResult } from "./types/survey";

const API_BASE_URL = "http://localhost:8080/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

export const getPosts = async (): Promise<Post[]> => {
  const response = await axios.get<Post[]>(`${API_BASE_URL}/posts`);
  return response.data;
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