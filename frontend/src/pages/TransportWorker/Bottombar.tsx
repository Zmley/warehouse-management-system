import React from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'

interface BottomBarProps {
  onCartClick: () => void
  onTaskListClick: () => void
}

const BottomBar: React.FC<BottomBarProps> = ({
  onCartClick,
  onTaskListClick
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: '#ffffff',
        boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        zIndex: 1200
      }}
    >
      {/* Cart Button */}
      <Box
        onClick={onCartClick}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#2563eb',
          '&:hover': {
            backgroundColor: '#e8f0fe'
          }
        }}
      >
        <IconButton sx={{ color: '#2563eb' }}>
          <Inventory2OutlinedIcon />
        </IconButton>
        <Typography variant='caption' fontWeight={600}>
          Cart
        </Typography>
      </Box>

      {/* Task Button */}
      <Box
        onClick={onTaskListClick}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#10b981',
          '&:hover': {
            backgroundColor: '#d1fae5'
          }
        }}
      >
        <IconButton sx={{ color: '#10b981' }}>
          <AssignmentOutlinedIcon />
        </IconButton>
        <Typography variant='caption' fontWeight={600}>
          Tasks
        </Typography>
      </Box>
    </Box>
  )
}

export default BottomBar
