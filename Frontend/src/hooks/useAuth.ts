import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { loginUser, fetchUserRole } from "../api/authApi";
import { saveTokens } from "../utils/storage";

export const useAuth = () => {
  const { logout, isAuthenticated, role, setRole } = useContext(AuthContext)!;
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setError(null); 
    try {
      const data = await loginUser(email, password);
      saveTokens(data);

      const roleData = await fetchUserRole();
      setRole(roleData);

      navigate("/dashboard");
    } catch (err: any) {
      console.error("❌ Login Error:", err.response?.data?.message || "Unknown error");
      setError(err.response?.data?.message || "❌ Login failed due to unknown error.");
    }
  };

  return { handleLogin, logout, isAuthenticated, role, error };
};