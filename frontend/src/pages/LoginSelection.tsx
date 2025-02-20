import React from "react";
import { Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { loginUser } from "../api/auth";  // ✅ 引入 API 请求
import { saveTokens } from "../utils/storage";  // ✅ 引入 Token 存储

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    try {
      const data = await loginUser(email, password); // ✅ 使用 API 层封装的请求
      saveTokens(data); // ✅ 存储 Token
      console.log("✅ Tokens stored:", data);

      // ✅ 登录成功后跳转
      navigate("/admin");
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