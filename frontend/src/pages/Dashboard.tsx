import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import TopBar from '../components/Topbar'
import WokerBottombar from '../components/WokerBottombar'
import PickerBottombar from './Picker/Bottombar'
import PendingTaskList from '../components/PendingTaskCard'
import PickerCreatedTaskList from './Picker/TaskListCard'
import { useAuth } from '../hooks/useAuth'
import { getPickerCreatedTasks } from '../api/taskApi'
import { Task } from '../types/task'
import AdminDashboard from './admin/AdminDashboard'

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const isPicker = userProfile.role === 'PICKER'
  const isTransportWorker = userProfile.role === 'TRANSPORT_WORKER'
  const isAdmin = userProfile.role === 'ADMIN'

  const [showCreatedTasks, setShowCreatedTasks] = useState(false)
  const [showArchivedTasks, setShowArchivedTasks] = useState(false)
  const [allTasks, setAllTasks] = useState<Task[]>([])

  const handleTaskListClick = async () => {
    try {
      const response = await getPickerCreatedTasks()
      setAllTasks(response)
      setShowCreatedTasks(true)
      setShowArchivedTasks(false)
    } catch (error) {
      console.error('Failed to fetch created tasks', error)
    }
  }

  const handleArchivedClick = async () => {
    try {
      const response = await getPickerCreatedTasks()
      setAllTasks(response)
      setShowCreatedTasks(false)
      setShowArchivedTasks(true)
    } catch (error) {
      console.error('Failed to fetch archived tasks', error)
    }
  }

  const handleRefresh = async () => {
    await handleTaskListClick()
  }

  if (isAdmin) {
    return <AdminDashboard />
  }
  return (
    <Box sx={{ height: '100vh', backgroundColor: '#F7F9FC' }}>
      <TopBar userName={`${userProfile.firstName} ${userProfile.lastName}`} />

      <Box sx={{ flex: 1, p: 2, pb: 8 }}>
        {isTransportWorker && <PendingTaskList />}

        {isPicker && showCreatedTasks && (
          <PickerCreatedTaskList
            createdTasks={allTasks.filter(task => task.status === 'PENDING')}
            onRefresh={handleRefresh}
            status='PENDING'
          />
        )}

        {isPicker && showArchivedTasks && (
          <PickerCreatedTaskList
            createdTasks={allTasks.filter(task => task.status === 'COMPLETED')}
            onRefresh={handleRefresh}
            status='COMPLETED'
          />
        )}

        {isPicker && !showCreatedTasks && !showArchivedTasks && (
          <Typography color='text.secondary' mt={4} textAlign='center'>
            Click "Task List" or "Archived Task" to view your tasks
          </Typography>
        )}
      </Box>

      {isPicker && (
        <PickerBottombar
          onTaskListClick={handleTaskListClick}
          onArchivedClick={handleArchivedClick}
        />
      )}

      {isTransportWorker && <WokerBottombar />}
    </Box>
  )
}

export default Dashboard
