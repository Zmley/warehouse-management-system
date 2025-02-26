import React, { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserRole, loginUser } from "../api/auth"; 
import { clearTokens, saveTokens,areTokensValid } from "../utils/storage";

interface AuthContextType {
  role: string | null;
  setRole: (role: string | null) => void;
  login: (email: string, password: string) => Promise<void>;  
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
      console.log("🔄 loading...");
      const tokens = await loginUser(email, password); 
      saveTokens(tokens); 
      const userRole = await fetchUserRole(); 
      setRole(userRole);
      navigate("/dashboard");
      console.log("✅ successfully，role is:", userRole);
    } catch (error: any) {
      console.error("❌ failed:", error.message);
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
      console.log("🔄 loading for the role...");
      fetchUserRole()
        .then((data) => {
          console.log("✅ role:", data);
          setRole(data);
        })
        .catch((error) => {
          console.error("❌ failed:", error);
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