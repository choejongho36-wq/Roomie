import axios from "axios";
import type { Post } from "./types";

const API_BASE_URL = "http://localhost:8080/api";

export const getPosts = async (): Promise<Post[]> => {
  const response = await axios.get<Post[]>(`${API_BASE_URL}/posts`);
  return response.data;
};