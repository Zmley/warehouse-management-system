import { Routes, Route } from "react-router-dom";
import LoginSelection from "../pages/LoginSelection";

const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginSelection />} />
      {/* 你可以在这里添加更多公共页面 */}
    </Routes>
  );
};

export default PublicRoutes;