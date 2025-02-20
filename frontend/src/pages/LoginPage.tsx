import React, { useContext } from "react";
import { Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { loginUser } from "../api/auth";
import { saveTokens } from "../utils/storage";
import { AuthContext } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useContext(AuthContext)!; // ✅ 使用 `AuthContext`

  const handleLogin = async (email: string, password: string) => {
    try {
      const data = await loginUser(email, password);
      saveTokens(data); // ✅ 存储 Token

      // ✅ 登录成功后，重新获取 `role`
      setRole(null);
      navigate("/dashboard"); // ✅ 统一跳转
    } catch (error: any) {
      console.error("❌ Login Error:", error.message);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <LoginForm onLogin={handleLogin} />
    </Container>
  );
};

export default LoginPage;