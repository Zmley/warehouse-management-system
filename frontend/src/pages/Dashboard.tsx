import React, { useContext, useEffect } from "react";
import { Container, Typography, Button } from "@mui/material";
import { AuthContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useTransportContext } from "../context/transportTaskContext";

const roleTitles: { [key: string]: string } = {
  admin: "Admin Dashboard 🎩",
  picker: "Picker Dashboard 📦",
  transportWorker: "Transport Worker Dashboard 🚛",
};

const Dashboard: React.FC = () => {
  const { role, logout, isAuthenticated } = useContext(AuthContext)!;
  const { transportStatus, resetTask } = useTransportContext(); // ✅ 读取状态 & 允许重置任务
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔄 Mounted Dashboard - Role:", role, " | Transport Status:", transportStatus);
  }, [role, transportStatus]);

  if (!isAuthenticated) {
    return <Typography variant="h5">❌ Not logged in, redirecting...</Typography>;
  }

  if (!role) {
    return <Typography variant="h5">⏳ Loading role...</Typography>;
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
        {roleTitles[role] || "Unknown Role"}
      </Typography>

      <Typography variant="body1" sx={{ marginBottom: 2 }}>
        Welcome, your role is <strong>{role || "unknown"}</strong>
      </Typography>

      {/* ✅ Admin 专属：库存管理 */}
      {role === "admin" && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/inventory")}
          sx={{ marginBottom: 2 }}
        >
          📦 Inventory Management
        </Button>
      )}

      {/* ✅ Transport Worker 任务入口 */}
      {role === "transportWorker" && (
       <Button
       variant="contained"
       color="secondary"
       onClick={() => {
         if (transportStatus === "pending") {
           resetTask(); // ✅ 确保只有在 pending 状态下重置任务
         }
         navigate("/transport-task");
       }}
       sx={{ marginBottom: 2 }}
     >
       🚛 Go to Transport Task
     </Button>
      )}

      <Button variant="contained" color="error" onClick={logout}>
        Logout
      </Button>
    </Container>
  );
};

export default Dashboard;