import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import LoginPage from "../pages/loginPage";

const PublicRoutes: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext)!;

  

  return (
    <Routes>
      {/* ✅ 如果用户已登录，自动跳转到 `/dashboard` */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
    </Routes>
  );
};

export default PublicRoutes;