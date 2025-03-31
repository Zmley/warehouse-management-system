import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import TopBar from '../components/Topbar'
import WokerBottombar from './TransportWorker/Bottombar'
import PickerBottombar from './Picker/Bottombar'
import PendingTaskList from '../components/TaskCard'
import PickerCreatedTaskList from './Picker/TaskListCard'
import { useAuth } from '../hooks/useAuth'
import { getPickerCreatedTasks } from '../api/taskApi'
import { Task } from '../types/task'
import { useNavigate } from 'react-router-dom'

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const isPicker = userProfile.role === 'PICKER'
  const isTransportWorker = userProfile.role === 'TRANSPORT_WORKER'
  const isAdmin = userProfile.role === 'ADMIN'

  const [showCreatedTasks, setShowCreatedTasks] = useState(false)
  const [showArchivedTasks, setShowArchivedTasks] = useState(false)
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [showTodoList, setShowTodoList] = useState(false)

  const navigate = useNavigate()

  const handleCreatWokerTask = () => {
    navigate('/scan-qr')
  }

  const handleWorkerTaskClick = () => {
    setShowCreatedTasks(false)
    setShowArchivedTasks(false)
    setShowTodoList(true)
  }

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
        {isTransportWorker && showTodoList && <PendingTaskList />}

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

      {isTransportWorker && !showCreatedTasks && !showArchivedTasks && (
        <Typography color='text.secondary' mt={4} textAlign='center'>
          Click "To do List" or "Create Task" to view your tasks
        </Typography>
      )}
      {isTransportWorker && (
        <WokerBottombar
          onTaskListClick={handleWorkerTaskClick}
          onCreateTaskClick={handleCreatWokerTask}
        />
      )}
    </Box>
  )
}

export default Dashboard
