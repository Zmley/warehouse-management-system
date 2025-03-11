import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "../hooks/useAuth"; // 调用 useAuth 里的 login
import { useNavigate } from "react-router-dom";

const AdminLogin: React.FC = () => {
  const { handleLogin, error } = useAuth(); // 获取 login 方法
  const navigate = useNavigate();
  
  // 管理输入状态
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 处理登录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleLogin(email, password); // 调用 useAuth 里的 login
      navigate("/AdminDashboard"); // 登录成功，跳转到 AdminDashboard
    } catch (err) {
      console.error("❌ Login failed:", err);
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F4F7FC", // 背景色
      }}
    >
      {/* 标题 */}
      <Typography variant="h4" fontWeight="bold" sx={{ color: "#265A9F", mb: 1 }}>
        Welcome to Inventory Management System
      </Typography>
      <Typography variant="subtitle1" sx={{ color: "#555", mb: 3 }}>
        Login with your account to manage your inventory
      </Typography>

      {/* 登录表单 */}
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 3,
        }}
      >
        {/* 头像 */}
        <AccountCircleIcon sx={{ fontSize: 60, color: "#265A9F", mb: 2 }} />

        {/* 表单 */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          {/* 用户名输入框 */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="User name"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* 密码输入框 */}
          <TextField
            fullWidth
            variant="outlined"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* 记住我 & 忘记密码 */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              mb: 2,
            }}
          >
            <FormControlLabel control={<Checkbox />} label="Remember me" />
            <Typography
              variant="body2"
              sx={{ color: "#265A9F", cursor: "pointer", fontWeight: "bold" }}
            >
              Forgot password?
            </Typography>
          </Box>

          {/* 登录按钮 */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#265A9F",
              color: "#fff",
              fontSize: "16px",
              padding: "10px 0",
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#1E4F8F" },
            }}
          >
            Login
          </Button>

          {/* 错误消息 */}
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2, textAlign: "center" }}>
              ❌ {error}
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminLogin;