import axios from "axios";
import type { Post } from "./types";

const API_BASE_URL = "http://localhost:8080/api";

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
  nickname: string
): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/signup`, { email, password, nickname });
};