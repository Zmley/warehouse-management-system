import React, { useContext } from "react";
import { Container, Typography, Button } from "@mui/material";
import { AuthContext } from "../context/AuthContext";

const Dashboard: React.FC = () => {
  const { role, logout } = useContext(AuthContext)!;

  if (!role) {
    return <Typography variant="h5">🔄 加载中...</Typography>;
  }

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
        {role === "admin"
          ? "Admin Dashboard 🎩"
          : role === "picker"
          ? "Picker Dashboard 📦"
          : role === "transportWorker"
          ? "Transport Worker Dashboard 🚛"
          : "Unknown Role"}
      </Typography>

      <Typography variant="body1" sx={{ marginBottom: 2 }}>
        欢迎, 你的角色是 <strong>{role}</strong>
      </Typography>

      <Button variant="contained" color="error" onClick={logout}>
        Logout
      </Button>
    </Container>
  );
};

export default Dashboard;