
import React, { useContext } from "react";
import { AuthContext } from "../context/authContext";
import { Navigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import WorkerDashboard from "./WokerDashboard";
import { Container, Typography } from "@mui/material";

const Dashboard: React.FC = () => {
  const { userProfile, isAuthenticated } = useContext(AuthContext)!;

  // ✅ 如果用户未登录，跳转到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // ✅ 如果用户信息还未加载，显示 "加载中"
  if (!userProfile) {
    return (
      <Container sx={{ textAlign: "center", marginTop: "50px" }}>
        <Typography variant="h5">🔄 Loading...</Typography>
      </Container>
    );
  }

  // ✅ 根据 `role` 显示不同的 Dashboard
  return userProfile.role === "admin" ? <AdminDashboard /> : <WorkerDashboard />;
};

export default Dashboard;