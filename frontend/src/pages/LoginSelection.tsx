// 文件路径: src/pages/LoginSelection.tsx

import React from "react";
import { Button, Container, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const LoginSelection: React.FC = () => {
  const navigate = useNavigate();

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
        Select Your Role
      </Typography>
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
        <Button variant="contained" fullWidth color="primary" onClick={() => navigate("/login/admin")}>
          Admin Login
        </Button>
        <Button variant="contained" fullWidth color="secondary" onClick={() => navigate("/login/transport-worker")}>
          Transport Worker Login
        </Button>
        <Button variant="contained" fullWidth color="success" onClick={() => navigate("/login/picker")}>
          Picker Login
        </Button>
      </Box>
    </Container>
  );
};

export default LoginSelection;
