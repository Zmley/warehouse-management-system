import apiClient from "./axiosClient.ts.js"; // 引入全局 apiClient

/**
 * ✅ 用户登录 API
 */
export const loginUser = async (email: string, password: string) => {
  const response = await apiClient.post("/api/auth/login", { email, password });
  return response.data;
};

/**
 * ✅ 获取用户 `role`
 */
export const fetchUserRole = async () => {
    console.log("🔍 正在请求用户角色...");
    const response = await apiClient.get("/api/auth/me");
    console.log("🟢 API 返回:", response.data); // 🔥 查看 API 返回的数据
    return response.data.user?.role || null;
  };