import React, { useContext } from "react";
import { Box } from "@mui/material";
import { AuthContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useDashboard } from "../context/DashboardContext";
import InventoryPage from "../components/InventoryPage"; // ✅ 确保路径正确
// import TaskPage from "../components/TaskPage"; // 假设有 TaskPage
// import ProductPage from "../components/ProductPage"; // 假设有 ProductPage
// import UserPage from "../components/UserPage"; // 假设有 UserPage

const AdminDashboard: React.FC = () => {
  const { logout } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const { currentPage } = useDashboard(); // ✅ 读取当前的 page

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ✅ 根据 `currentPage` 选择要显示的组件
  const renderPage = () => {
    switch (currentPage) {
      case "inventory":
        return <InventoryPage />;
    //   case "tasks":
    //     return <TaskPage />;
    //   case "products":
    //     return <ProductPage />;
    //   case "users":
    //     return <UserPage />;
    //   default:
    //     return <Typography variant="h5">📌 Select a menu item</Typography>;
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f8f9fb" }}>
      {/* 左侧 Sidebar */}
      <Sidebar />

      {/* 右侧内容区域 */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* 顶部 Topbar */}
        <Topbar />

        {/* ✅ 动态渲染页面 */}
        <Box sx={{ flexGrow: 1, padding: "20px" }}>{renderPage()}</Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;