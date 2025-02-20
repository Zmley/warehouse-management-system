// 文件路径: src/components/LoginForm.tsx

import React, { useState } from "react";
import { Button, TextField, Box, Typography } from "@mui/material";

interface LoginFormProps {
  role: "admin" | "transport-worker" | "picker";
  onLogin: (email: string, password: string) => void;
  onBack: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ role, onLogin, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
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
        {role.charAt(0).toUpperCase() + role.slice(1)} Login
      </Typography>
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
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
        <Button type="submit" variant="contained" fullWidth color="primary">
          Login
        </Button>
        <Button variant="text" fullWidth onClick={onBack} sx={{ mt: 1 }}>
          Back
        </Button>
      </form>
    </Box>
  );
};

export default LoginForm;
