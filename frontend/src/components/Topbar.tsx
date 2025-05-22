// components/TopBar.tsx
import React, { useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import ProfileDrawer from 'pages/Profile'

interface TopBarProps {
  userName: string
}

const TopBar: React.FC<TopBarProps> = ({ userName }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          backgroundColor: '#fff',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)'
        }}
      >
        <IconButton onClick={() => setDrawerOpen(true)}>
          <MenuIcon sx={{ fontSize: 24, color: '#333' }} />
        </IconButton>
        <Typography
          variant='subtitle1'
          sx={{ fontWeight: 600, color: '#333', flex: 1, textAlign: 'center' }}
        >
          Hello, {userName}
        </Typography>
        <Box sx={{ width: 40 }} />
      </Box>

      <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

export default TopBar
