import React, { useContext, useEffect } from "react";
import { Container, Typography, Button, CircularProgress } from "@mui/material";
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
  const { transportStatus, fetchTaskStatus } = useTransportContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTaskStatus(); // ✅ 确保获取最新状态
  }, [fetchTaskStatus]); // ✅ 解决 ESLint 警告，正确依赖 fetchTaskStatus

  useEffect(() => {
    console.log("🔄 Dashboard Loaded - Role:", role, " | Transport Status:", transportStatus);
  }, [role, transportStatus]);

  if (!isAuthenticated) {
    return <Typography variant="h5">❌ Not logged in, redirecting...</Typography>;
  }

  if (!role) {
    return <Typography variant="h5">⏳ Loading role...</Typography>;
  }

  if (transportStatus === null) {
    return (
      <Container sx={{ textAlign: "center", marginTop: "50px" }}>
        <CircularProgress />
      </Container>
    );
  }

  const handleTransportTask = () => {
    if (transportStatus === "completed") {
      navigate("/scan-task"); // ✅ 任务完成后，进入扫码页面
    } else if (transportStatus === "inProgress") {
      navigate("/in-process-task"); // ✅ 任务未完成，进入任务详情页
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
      <Typography variant="h4" gutterBottom>
        {roleTitles[role] || "Unknown Role"}
      </Typography>

      <Typography variant="body1" sx={{ marginBottom: 2 }}>
        Welcome, your role is <strong>{role || "unknown"}</strong>
      </Typography>

      {/* ✅ Transport Worker 任务入口 */}
      {role === "transportWorker" && (
        <Button
          variant="contained"
          color="secondary"
          onClick={handleTransportTask}
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