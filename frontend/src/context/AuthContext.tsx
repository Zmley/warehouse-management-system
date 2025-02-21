import React, { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserRole, loginUser } from "../api/auth";  // ✅ 确保引入 `loginUser`
import { clearTokens, saveTokens,areTokensValid } from "../utils/storage";

interface AuthContextType {
  role: string | null;
  setRole: (role: string | null) => void;
  login: (email: string, password: string) => Promise<void>;  // ✅ 添加 login 方法
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = !!areTokensValid();

  const login = async (email: string, password: string) => {
    try {
      console.log("🔄 正在登录...");
      const tokens = await loginUser(email, password); // ✅ 登录请求
      saveTokens(tokens); // ✅ 存储 tokens
      const userRole = await fetchUserRole(); // ✅ 获取角色
      setRole(userRole);
      navigate("/dashboard");
      console.log("✅ 登录成功，角色:", userRole);
    } catch (error: any) {
      console.error("❌ 登录失败:", error.message);
      throw error;
    }
  };

  const logout = useCallback(() => {
    clearTokens();
    setRole(null);
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated && !role) {
      console.log("🔄 正在获取用户角色...");
      fetchUserRole()
        .then((data) => {
          console.log("✅ 用户角色:", data);
          setRole(data);
        })
        .catch((error) => {
          console.error("❌ 获取角色失败:", error);
          logout();
        });
    }
  }, [isAuthenticated, logout, role]);

  return (
    <AuthContext.Provider value={{ role, setRole, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};