import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { loginUser, fetchUserRole } from "../api/auth";
import { saveTokens } from "../utils/storage";

export const useAuth = () => {
  const { logout, isAuthenticated, role, setRole } = useContext(AuthContext)!;
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setError(null); // ✅ 先清空错误
    try {
      // ✅ 1. 发送登录请求，获取 token
      const data = await loginUser(email, password);
      saveTokens(data);

      // ✅ 2. 获取用户角色
      const roleData = await fetchUserRole();
      setRole(roleData);

      // ✅ 3. 登录成功，跳转到 dashboard
      navigate("/dashboard");
    } catch (err: any) {
      console.error("❌ Login Error:", err.response?.data?.message || "Unknown error");
      setError(err.response?.data?.message || "❌ Login failed due to unknown error.");
    }
  };

  return { handleLogin, logout, isAuthenticated, role, error };
};