import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  const isAuthenticated = !!localStorage.getItem("accessToken"); // 这里检查是否登录

  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;