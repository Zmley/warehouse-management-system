// src/components/TopBar.tsx
import React from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  userName: string
}

const TopBar: React.FC<TopBarProps> = ({ userName }) => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: '#FFF',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <IconButton onClick={() => navigate('/profile')}>
        <MenuIcon sx={{ fontSize: '28px', color: '#333' }} />
      </IconButton>

      <Typography variant='h6' sx={{ fontWeight: 'bold', color: '#333' }}>
        Hello, {userName}
      </Typography>

      <Box sx={{ width: '48px' }} />
    </Box>
  )
}

export default TopBar
