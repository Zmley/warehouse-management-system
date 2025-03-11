import React, { useContext } from "react";
import { Container, Grid, Paper, Typography, Button, Box } from "@mui/material";
import { AuthContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";


const AdminDashboard: React.FC = () => {
  const { logout } = useContext(AuthContext)!;
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f8f9fb" }}>
      {/* 左侧 Sidebar */}
      <Sidebar />

      {/* 右侧内容区域 */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* 顶部 Topbar */}
        <Topbar />

        {/* 主内容区 */}
        <Container maxWidth="lg" sx={{ marginTop: 4 }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Admin Dashboard</Typography>
            <Button variant="contained" color="error" onClick={handleLogout}>
              Logout
            </Button>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard;