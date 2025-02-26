import React, { useContext } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import Dashboard from "../pages/dashboard";
import InventoryManagement from "../pages/Admin/InventoryManagementPage";
import EditInventoryPage from "../components/admin/editInventoryPage"; // ✅ 引入编辑页面
import TransportTask from "../pages/TransportWorker/transportTask";



// ✅ 受保护的路由
const PrivateRoute: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext)!;
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

// ✅ 受保护的路由配置
const PrivateRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/transport-task" element={<TransportTask />} />
        <Route path="/inventory/edit/:id" element={<EditInventoryPage />} /> {/* ✅ 新增路由 */}
      </Route>
    </Routes>
  );
};

export default PrivateRoutes;