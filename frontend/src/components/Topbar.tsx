import React, { useState } from 'react'
import { Box, IconButton, Typography, Tooltip, Button } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'

import DocumentScannerOutlinedIcon from '@mui/icons-material/DocumentScannerOutlined'

import { useNavigate } from 'react-router-dom'
import ProfileDrawer from 'pages/Profile'

interface TopBarProps {
  userName: string
}

const TopBar: React.FC<TopBarProps> = ({ userName }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

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
          backgroundColor: '#f9fafb',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.06)'
        }}
      >
        {/* Left menu icon */}
        <IconButton onClick={() => setDrawerOpen(true)}>
          <MenuIcon sx={{ fontSize: 24, color: '#333' }} />
        </IconButton>

        {/* Center title */}
        <Typography
          variant='subtitle1'
          sx={{ fontWeight: 600, color: '#333', flex: 1, textAlign: 'center' }}
        >
          Hello, {userName}
        </Typography>

        {/* Right scan icon */}
        <Tooltip title='Pick up Task'>
          <Button
            variant='text'
            onClick={() => navigate('/picker-scan-bin')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: '#2563eb',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: 14,
              minWidth: 'auto',
              padding: 0
            }}
            startIcon={<DocumentScannerOutlinedIcon sx={{ fontSize: 20 }} />}
          >
            Pick
          </Button>
        </Tooltip>
      </Box>

      <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

export default TopBar
