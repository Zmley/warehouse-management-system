import React, { useContext } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import Dashboard from "../pages/Dashboard";
import InventoryManagement from "../pages/admin/InventoryManagement";
import EditInventoryPage from "../components/admin/InventoryPage"; 
import InProcessTaskPage from "../pages/TransportWorker/InProcessPage"; // ✅ 任务进行中界面
import ScanTaskPage from "../pages/TransportWorker/ScanTask"; // ✅ 任务进行中界面
import LoadingPage from "../pages/LoadingPage"; // ✅ 任务进行中界面
import AcceptedProcessTaskPage from "../pages/TransportWorker/AcceptedProcessTaskPage"; // ✅ 任务进行中界面


// import TransportTask from "../pages/transportWorker/transportTask";
// import ScanCargo from "../pages/transportWorker/transportTask"; // ✅ 确保引入页面
// import LoadCargo from "../pages/transportWorker/transportTask"; // ✅ 确保这个组件存在




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
        <Route path="/inventory/edit/:id" element={<EditInventoryPage />} /> 
        <Route path="/in-process-task" element={<InProcessTaskPage />} />
        <Route path="/scan-task" element={<ScanTaskPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/accepted-process-task" element={<AcceptedProcessTaskPage />} />


      </Route>
    </Routes>
  );
};

export default PrivateRoutes;