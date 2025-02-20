// 文件路径: src/api/auth.ts
import axios from "axios";

// 读取环境变量
const API_BASE_URL = process.env.SERVER_API_BASE_URL || "http://localhost:5001";

/**
 * ✅ 用户登录 API
 */
export const loginUser = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
    email,
    password,
  });

  return response.data; // 返回登录成功的 Token
};