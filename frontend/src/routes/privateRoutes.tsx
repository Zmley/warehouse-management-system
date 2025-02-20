import React, { useContext } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // ✅ 从 AuthContext 获取用户信息
import AdminDashboard from "../pages/Admin/AdminDashboard";
import PickerDashboard from "../pages/Picker/PickerDashboard";
import TWDashboard from "../pages/TransportWorker/TWDashboard";

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, role } = useContext(AuthContext)!;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

const PrivateRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={
          <RoleBasedDashboard />
        } />
      </Route>
    </Routes>
  );
};

// ✅ 根据 role 渲染不同的 Dashboard
const RoleBasedDashboard: React.FC = () => {
  const { role } = useContext(AuthContext)!;

  if (role === "admin") {
    return <AdminDashboard />;
  } else if (role === "picker") {
    return <PickerDashboard />;
  } else if (role === "transportWorker") {
    return <TWDashboard />;
  }

  return <Navigate to="/login" />;
};

export default PrivateRoutes;