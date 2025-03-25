import React from 'react'
import { Box, Typography } from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import TopBar from '../components/Topbar'
import BottomBar from '../components/Bottombar'

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth()

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
        <Typography
          variant='h6'
          sx={{ fontWeight: 'bold', textAlign: 'center', my: 2 }}
        >
          Hello, {userProfile.firstName} {userProfile.lastName}!
        </Typography>
      </Box>
    )
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
      {/* TopBar Component */}
      <TopBar userName={`${userProfile.firstName} ${userProfile.lastName}`} />

      {/* Page content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
          Dashboard Content Goes Here
        </Typography>
      </Box>

      {userProfile.role === 'TRANSPORT_WORKER' && <BottomBar />}
    </Box>
  )
}

export default Dashboard
