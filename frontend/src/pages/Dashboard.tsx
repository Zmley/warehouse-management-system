import React, { useContext } from 'react'
import {
  Typography,
  Box,
  IconButton,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import { AuthContext } from '../context/authContext'
import { useNavigate } from 'react-router-dom'

const Dashboard: React.FC = () => {
  const { userProfile, isAuthenticated } = useContext(AuthContext)!
  const navigate = useNavigate()

  if (!isAuthenticated) {
    return (
      <Typography variant='h5'>❌ Not logged in, redirecting...</Typography>
    )
  }

  if (!userProfile) {
    return <Typography variant='h5'></Typography>
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
      {/* ✅ 顶部导航栏 */}
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
          Hello, {userProfile.firstname} {userProfile.lastname}!
        </Typography>

        <Box sx={{ width: '48px' }} />
      </Box>

      {/* ✅ 中间内容区域（待开发） */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <Typography variant='h6' sx={{ color: '#666' }}>
          🚧 Task List Section (Under Development)
        </Typography>
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
          onClick={() => navigate('/create-task')}
          sx={{ minWidth: '50%' }}
        />
      </BottomNavigation>
    </Box>
  )
}

export default Dashboard
