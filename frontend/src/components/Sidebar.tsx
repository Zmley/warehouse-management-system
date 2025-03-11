import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const sidebarItems = [
  { icon: '/task.png', label: 'Tasks', path: '/tasks' },
  { icon: '/inventory.png', label: 'Inventory', path: '/inventory' },
  { icon: '/product.png', label: 'Products', path: '/products' },
  { icon: '/user.png', label: 'Users', path: '/users' }
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: '96px',
        height: '100vh',
        backgroundColor: '#3F72AF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '160px', // 第一个图标离顶部 160px
      }}
    >
      {sidebarItems.map((item, index) => (
        <Box
          key={index}
          sx={{
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: index === sidebarItems.length - 1 ? 0 : '45px' // 每个图标间隔 45px，最后一个不加 margin
          }}
          onClick={() => navigate(item.path)}
        >
          <img src={item.icon} alt={item.label} style={{ width: '32px', height: '32px' }} />
          <Typography
            variant="caption"
            sx={{ color: '#fff', marginTop: '4px', display: 'block' }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default Sidebar;