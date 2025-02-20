import axios from "axios";
import { getAccessToken } from "../utils/storage";

const API_BASE_URL = process.env.SERVER_API_BASE_URL || "http://localhost:5001";

/**
 * ✅ 用户登录 API
 */
export const loginUser = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
  return response.data;
};

/**
 * ✅ 获取用户 `role`
 */
export const fetchUserRole = async () => {
  const token = getAccessToken();
  if (!token) throw new Error("用户未登录");

  const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.role; // ✅ 服务器返回用户角色
};