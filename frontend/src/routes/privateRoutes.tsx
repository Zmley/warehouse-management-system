import React, { useContext } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import Dashboard from "../pages/dashboard";
import InventoryManagement from "../pages/Admin/InventoryManagementPage";
import EditInventoryPage from "../components/admin/InventoryPage"; 
import TransportTask from "../pages/transportWorker/transportTask";


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
      </Route>
    </Routes>
  );
};

export default PrivateRoutes;