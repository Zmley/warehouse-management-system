// 📁 src/pages/Dashboard.tsx

import React from 'react'
import { Box, Typography } from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import TopBar from '../components/Topbar'
import WokerBottombar from '../components/WokerBottombar'
import PickerBottombar from '../components/PickerBottombar'
import PendingTaskList from '../components/PendingTaskCard'

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth()

  const isTransportWorker = userProfile.role === 'TRANSPORT_WORKER'
  const isPicker = userProfile.role === 'PICKER'
  const isAdmin = userProfile.role === 'ADMIN'

  if (isAdmin) {
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
          Hello Admin, {userProfile.firstName} {userProfile.lastName}!
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

      {isTransportWorker && <PendingTaskList />}

      {isPicker && <PickerBottombar />}

      {isTransportWorker && <WokerBottombar />}
    </Box>
  )
}

export default Dashboard
