import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import TopBar from '../components/Topbar'
import WokerBottombar from '../components/Bottombar'
import TaskList from '../components/TaskCard'
import { useAuth } from '../hooks/useAuth'

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const isPicker = userProfile.role === 'PICKER'
  const isTransportWorker = userProfile.role === 'TRANSPORT_WORKER'
  const isAdmin = userProfile.role === 'ADMIN'

  if (isAdmin) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant='h6'>
          Hello Admin, {userProfile.firstName}!
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100vh', backgroundColor: '#F7F9FC' }}>
      <TopBar userName={`${userProfile.firstName} ${userProfile.lastName}`} />

      <Box sx={{ flex: 1, p: 2, pb: 8 }}>
        {isTransportWorker && <TaskList />}
      </Box>

      {isTransportWorker && <WokerBottombar />}
    </Box>
  )
}

export default Dashboard
