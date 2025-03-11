import React, { useContext } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import Dashboard from "../pages/Dashboard"; // 这里的 Dashboard 组件会自动根据 role 加载 Admin 或 Worker 界面
import Profile from "../pages/Profile";

const PrivateRoute: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext)!;
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

const PrivateRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        {/* 这里的 Dashboard 组件会自动判断用户角色 */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
};

export default PrivateRoutes;