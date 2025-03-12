import React from "react";
import { Box, Typography } from "@mui/material";
import { useDashboard } from "../context/DashboardContext";

const sidebarItems = [
  { icon: "/task.png", label: "Tasks", page: "tasks" },
  { icon: "/inventory.png", label: "Inventory", page: "inventory" },
  { icon: "/product.png", label: "Products", page: "products" },
  { icon: "/user.png", label: "Users", page: "users" }
];

const Sidebar: React.FC = () => {
  const { setCurrentPage } = useDashboard();

  return (
    <Box
      sx={{
        width: "96px",
        height: "100vh",
        backgroundColor: "#3F72AF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "160px", // 第一个图标距离顶部 160px
      }}
    >
      {sidebarItems.map((item, index) => (
        <Box
          key={index}
          sx={{
            textAlign: "center",
            marginBottom: "45px", // 每个部分的间隔 45px
            cursor: "pointer"
          }}
          onClick={() => setCurrentPage(item.page as any)}
        >
          <img src={item.icon} alt={item.label} style={{ width: "32px", height: "32px" }} />
          <Typography variant="caption" sx={{ color: "#fff", marginTop: "4px", display: "block" }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default Sidebar;