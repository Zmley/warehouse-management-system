import React, { useState } from "react";
import { Container, Typography, Alert, Button, TextField, Box } from "@mui/material";
import { useAuth } from "../hooks/useAuth"; // ✅ 直接引入 useAuth

const LoginPage: React.FC = () => {
  const { handleLogin, error } = useAuth(); // ✅ 直接使用 `useAuth`

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        welcome 🚀
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          gap: 2,
        }}
      >
        <TextField label="Email" variant="outlined" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" />
        <TextField label="Password" variant="outlined" fullWidth type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" />
        <Button variant="contained" fullWidth color="primary" onClick={() => handleLogin(email, password)}>
          Login
        </Button>
      </Box>
    </Container>
  );
};

export default LoginPage;