import React, { useState } from "react";
import { Button, TextField, Box, Typography, Alert } from "@mui/material";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  role?: string; // ✅ 添加 role 作为可选参数
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, role }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        gap: 2,
      }}
    >
      <Typography variant="h5" gutterBottom>
        {role ? `登录 - ${role.toUpperCase()}` : "登录"}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        label="Email"
        variant="outlined"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
      />
      <TextField
        label="Password"
        variant="outlined"
        fullWidth
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
      />
      <Button variant="contained" fullWidth color="primary" onClick={handleLogin}>
        登录
      </Button>
    </Box>
  );
};

export default LoginForm;