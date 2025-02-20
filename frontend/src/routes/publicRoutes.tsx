import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";

const PublicRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} /> {/* 默认首页 */}
      {/* 可以在这里添加更多公共页面 */}
    </Routes>
  );
};

export default PublicRoutes;