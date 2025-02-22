import React, { useContext, useEffect } from "react";
import { Container, Typography, Button } from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

const roleTitles: { [key: string]: string } = {
  admin: "Admin Dashboard 🎩",
  picker: "Picker Dashboard 📦",
  transportWorker: "Transport Worker Dashboard 🚛",
};

const Dashboard: React.FC = () => {
  const { role, logout, isAuthenticated } = useContext(AuthContext)!;

  useEffect(() => {
    console.log("🔄 Mounted Dashboard - Role:", role);
  }, [role]);

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

      {/* ✅ Only Admins See This Button */}
      {role === "admin" && (
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/inventory"
          sx={{ marginBottom: 2 }}
        >
          📦 Inventory Management
        </Button>
      )}

      <Button variant="contained" color="error" onClick={logout}>
        Logout
      </Button>
    </Container>
  );
};

export default Dashboard;