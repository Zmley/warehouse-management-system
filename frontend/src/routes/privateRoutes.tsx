import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import PickerDashboard from "../pages/Picker/PickerDashboard";
import TWDashboard from "../pages/TransportWorker/TWDashboard";

const PrivateRoutes = () => {
  return (
    <Routes>
      {/* 用 PrivateRoute 保护这些路由 */}
      <Route element={<PrivateRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/picker" element={<PickerDashboard />} />
        <Route path="/transportWorker" element={<TWDashboard />} />
      </Route>
    </Routes>
  );
};

export default PrivateRoutes;