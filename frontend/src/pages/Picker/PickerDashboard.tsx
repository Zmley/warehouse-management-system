import React from "react";
import { Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { clearTokens } from "../../utils/storage"; //


const PickerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // ✅ 清除 LocalStorage 中的 Token
    clearTokens();
    console.log("❌ Tokens removed, user logged out");

    // ✅ 退出后跳转回登录页
    navigate("/");
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
      <Typography variant="h4" gutterBottom>
        Welcome to picker Dashboard 🎉
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: 2 }}>
        You are logged in!
      </Typography>
      <Button variant="contained" color="error" onClick={handleLogout}>
        Logout
      </Button>
    </Container>
  );
};

export default PickerDashboard;