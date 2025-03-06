import React, { useContext } from "react";
import { Container, Typography, Box, IconButton, Button, Avatar } from "@mui/material";
import { ArrowBack as ArrowBackIcon, Logout as LogoutIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext"; // ✅ 直接从 `AuthContext` 取数据

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { logout, userProfile } = useContext(AuthContext)!;

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", padding: "20px", height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ✅ 顶部返回按钮 */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton onClick={() => navigate("/dashboard")} sx={{ alignSelf: "flex-start" }}>
          <ArrowBackIcon sx={{ fontSize: "28px", color: "#333" }} />
        </IconButton>
      </Box>

      {/* ✅ Profile 头像和名字 */}
      <Avatar src="/profile.jpg" sx={{ width: 80, height: 80, margin: "0 auto 10px" }} />
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
        {userProfile?.firstname} {userProfile?.lastname}
      </Typography>

      {/* ✅ 用户信息 */}
      <Box sx={{ textAlign: "left", mt: 2 }}>
        <Typography sx={{ fontWeight: "bold", color: "#666", mb: 1 }}>Username</Typography>
        <Typography sx={{ color: "#2272FF", fontWeight: "bold" }}>{userProfile?.email}</Typography>

        <Typography sx={{ fontWeight: "bold", color: "#666", mt: 2, mb: 1 }}>First Name</Typography>
        <Typography sx={{ color: "#2272FF", fontWeight: "bold" }}>{userProfile?.firstname}</Typography>

        <Typography sx={{ fontWeight: "bold", color: "#666", mt: 2, mb: 1 }}>Last Name</Typography>
        <Typography sx={{ color: "#2272FF", fontWeight: "bold" }}>{userProfile?.lastname}</Typography>

        {/* ✅ 角色信息 */}
        <Typography sx={{ fontWeight: "bold", color: "#666", mt: 2, mb: 1 }}>Role</Typography>
        <Typography sx={{ color: "#2272FF", fontWeight: "bold" }}>{userProfile?.role}</Typography>
      </Box>

      {/* ✅ 登出按钮 */}
      <Box sx={{ position: "absolute", bottom: "20px", width: "100%" }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            logout();
            navigate("/login");
          }}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderRadius: "20px",
            fontSize: "16px",
            fontWeight: "bold",
            borderColor: "#000",
            color: "#000",
            "&:hover": { backgroundColor: "#EEE" },
          }}
        >
          Sign Out
          <LogoutIcon />
        </Button>
      </Box>
    </Container>
  );
};

export default Profile;