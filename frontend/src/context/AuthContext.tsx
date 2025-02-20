import React, { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clearTokens } from "../utils/storage";

interface AuthContextType {
  role: string | null;
  setRole: (role: string | null) => void;
  logout: () => void;
  isAuthenticated: boolean; // ✅ 添加 isAuthenticated
}

// ✅ 创建 AuthContext
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<string | null>(null); 
  const navigate = useNavigate();

  // ✅ 计算是否已登录
  const isAuthenticated = !!role; // 只要 role 存在就认为已登录

  // ✅ 退出登录
  const logout = useCallback(() => {
    clearTokens();
    setRole(null);
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      logout();
    }
  }, [isAuthenticated, logout]);

  return (
    <AuthContext.Provider value={{ role, setRole, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};