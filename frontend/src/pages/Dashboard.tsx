import React from 'react'
import {
  Typography,
  Box,
  IconButton,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCargoContext } from '../contexts/cart'

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const { hasCargoInCar } = useCargoContext()

  if (
    userProfile.role !== 'TRANSPORT_WORKER' &&
    userProfile.role !== 'PICKER'
  ) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: '#F7F9FC'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            backgroundColor: '#FFF',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography variant='h6' sx={{ fontWeight: 'bold', color: '#333' }}>
            Hello, {userProfile.firstName} {userProfile.lastName}!
          </Typography>
        </Box>
      </Box>
    )
  }

  const handleClick = () => {
    if (hasCargoInCar) {
      navigate('/in-process-task')
    } else {
      navigate('/scan-qr')
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#F7F9FC'
      }}
    >
      <Box
        sx={{
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
          Hello, {userProfile.firstName} {userProfile.lastName}!
        </Typography>

        <Box sx={{ width: '48px' }} />
      </Box>

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
          showLabel
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
          showLabel
          icon={
            <img
              src='/Vector.png'
              alt='Create new task'
              style={{ width: 24, height: 24 }}
            />
          }
          onClick={handleClick}
          sx={{ minWidth: '50%' }}
        />
      </BottomNavigation>
    </Box>
  )
}

export default Dashboard
