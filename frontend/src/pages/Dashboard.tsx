import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import TopBar from '../components/Topbar'
import WokerBottombar from '../components/WokerBottombar'
import PickerBottombar from './Picker/PickerBottombar'
import PendingTaskList from '../components/PendingTaskCard'
import PickerCreatedTaskList from './Picker/PickerCreatedTaskList'
import { useAuth } from '../hooks/useAuth'
import { getPickerCreatedTasks } from '../api/taskApi'
import { Task } from '../types/task'

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const isPicker = userProfile.role === 'PICKER'
  const isTransportWorker = userProfile.role === 'TRANSPORT_WORKER'
  const isAdmin = userProfile.role === 'ADMIN'

  const [showCreatedTasks, setShowCreatedTasks] = useState(false)
  const [createdTasks, setCreatedTasks] = useState<Task[]>([])

  const handleTaskListClick = async () => {
    try {
      const response = await getPickerCreatedTasks()
      setCreatedTasks(response)
      setShowCreatedTasks(true)
    } catch (error) {
      console.error('Failed to fetch created tasks', error)
    }
  }

  const handleArchivedClick = () => {
    setShowCreatedTasks(false)
  }

  const handleRefresh = async () => {
    await handleTaskListClick()
  }

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
        {isTransportWorker && <PendingTaskList />}

        {isPicker && showCreatedTasks && (
          <PickerCreatedTaskList
            createdTasks={createdTasks}
            onRefresh={handleRefresh}
          />
        )}

        {isPicker && !showCreatedTasks && (
          <Typography color='text.secondary' mt={4} textAlign='center'>
            Click "Task List" to view your tasks
          </Typography>
        )}
      </Box>

      {isPicker && (
        <PickerBottombar
          onTaskListClick={handleTaskListClick}
          // onArchivedClick={handleArchivedClick}
        />
      )}

      {isTransportWorker && <WokerBottombar />}
    </Box>
  )
}

export default Dashboard
