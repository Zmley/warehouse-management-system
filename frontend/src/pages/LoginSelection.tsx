// 文件路径: src/pages/LoginSelection.tsx

import React, { useState } from "react";
import { Button, Container, Typography, Box, TextField } from "@mui/material";

const LoginSelection: React.FC = () => {
  const [role, setRole] = useState<"admin" | "transport-worker" | "picker" | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    console.log(`Logging in as ${role}`, { email, password });
    // 这里可以调用后端 API 进行身份验证
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
      {role === "" ? (
        <>
          <Typography variant="h4" gutterBottom>
            Select Your Role
          </Typography>
          <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
            <Button variant="contained" fullWidth color="primary" onClick={() => setRole("admin")}>
              Admin
            </Button>
            <Button variant="contained" fullWidth color="secondary" onClick={() => setRole("transport-worker")}>
              Transport Worker
            </Button>
            <Button variant="contained" fullWidth color="success" onClick={() => setRole("picker")}>
              Picker
            </Button>
          </Box>
        </>
      ) : (
        <>
          <Typography variant="h4" gutterBottom>
            {role.charAt(0).toUpperCase() + role.slice(1)} Login
          </Typography>
          <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              variant="outlined"
              fullWidth
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button variant="contained" fullWidth color="primary" onClick={handleLogin}>
              Login
            </Button>
            <Button variant="text" fullWidth onClick={() => setRole("")}>Back</Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default LoginSelection;
