import React from 'react';
import { Box, Typography } from '@mui/material';

// Tasks组件
const Tasks = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h6">Tasks Component</Typography>
  </Box>
);

// Inventory组件
const Inventory = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h6">Inventory Component</Typography>
  </Box>
);

// Products组件
const Products = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h6">Products Component</Typography>
  </Box>
);

// Users组件
const Users = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h6">Users Component</Typography>
  </Box>
);

// 主 AdminDashboard 组件
const AdminDashboard = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* 左边菜单区域 */}
      <Box
        sx={{
          width: '250px',
          bgcolor: '#1976d2',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          pt: 3,
        }}
      >
        <Typography sx={{ p: 2 }}>Tasks</Typography>
        <Typography sx={{ p: 2 }}>Inventory</Typography>
        <Typography sx={{ p: 2 }}>Products</Typography>
        <Typography sx={{ p: 2 }}>Users</Typography>
      </Box>

      {/* 右边内容区域 */}
      <Box sx={{ flex: 1, p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Welcome Name!
        </Typography>
        {/* 可以在这里切换显示的组件，这里先默认展示Tasks */}
        <Tasks />
        {/* <Inventory /> */}
        {/* <Products /> */}
        {/* <Users /> */}
      </Box>
    </Box>
  );
};

export default AdminDashboard;
