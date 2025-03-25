// src/components/BottomBar.tsx
import React from 'react'
import { BottomNavigation, BottomNavigationAction } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const BottomBar: React.FC = () => {
  const navigate = useNavigate()

  return (
    <BottomNavigation
      showLabels
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <BottomNavigationAction
        label='Task List'
        icon={
          <img
            src='/Vector-2.png'
            alt='Task List'
            style={{ width: 24, height: 24 }}
          />
        }
        onClick={() => navigate('/task-list')}
        sx={{ minWidth: '50%' }}
      />
      <BottomNavigationAction
        label='Create new task'
        icon={
          <img
            src='/Vector.png'
            alt='Create new task'
            style={{ width: 24, height: 24 }}
          />
        }
        onClick={() => navigate('/scan-qr')}
        sx={{ minWidth: '50%' }}
      />
    </BottomNavigation>
  )
}

export default BottomBar
