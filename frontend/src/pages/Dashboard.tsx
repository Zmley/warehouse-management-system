import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import TopBar from '../components/Topbar'
import WokerBottombar from '../components/WokerBottombar'
import PickerBottombar from '../components/PickerBottombar'
import PendingTaskList from '../components/PendingTaskCard'
import PickerCreatedTaskList from '../components/PickerCreatedTaskList'
import { getPickerCreatedTasks } from '../api/taskApi'
import { Task } from '../types/task'

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth()

  const isTransportWorker = userProfile.role === 'TRANSPORT_WORKER'
  const isPicker = userProfile.role === 'PICKER'
  const isAdmin = userProfile.role === 'ADMIN'

  const [createdTasks, setCreatedTasks] = useState<Task[]>([])

  const fetchCreatedTasks = async () => {
    try {
      const res = await getPickerCreatedTasks()
      setCreatedTasks(res)
    } catch (error) {
      console.error('❌ Failed to load created tasks:', error)
    }
  }

  useEffect(() => {
    if (isPicker) {
      fetchCreatedTasks()
    }
  }, [isPicker])

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

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          pb: 10 // padding bottom for bottom bar spacing
        }}
      >
        {isTransportWorker && <PendingTaskList />}

        {isPicker && (
          <PickerCreatedTaskList
            createdTasks={Array.isArray(createdTasks) ? createdTasks : []}
            onRefresh={fetchCreatedTasks}
          />
        )}
      </Box>

      {/* Bottom Bars */}
      {isPicker && <PickerBottombar />}
      {isTransportWorker && <WokerBottombar />}
    </Box>
  )
}

export default Dashboard
