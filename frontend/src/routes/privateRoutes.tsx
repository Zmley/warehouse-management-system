import React, { useContext } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import Dashboard from "../pages/dashboard";
import InventoryManagement from "../pages/Admin/InventoryManagementPage";
import EditInventoryPage from "../components/admin/InventoryPage"; 
import TransportTask from "../pages/transportWorker/transportTask";
import ScanCargo from "../pages/transportWorker/transportTask"; // ✅ 确保引入页面
import LoadCargo from "../pages/transportWorker/transportTask"; // ✅ 确保这个组件存在




const PrivateRoute: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext)!;
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

const PrivateRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/transport-task" element={<TransportTask />} />
        <Route path="/inventory/edit/:id" element={<EditInventoryPage />} /> 
        <Route path="/scan-cargo" element={<ScanCargo />} />
        <Route path="/load-cargo" element={<LoadCargo />} /> {/* ✅ 确保这个路由存在 */}
      </Route>
    </Routes>
  );
};

export default PrivateRoutes;