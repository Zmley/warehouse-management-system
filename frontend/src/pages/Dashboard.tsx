import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
import TopBar from '../components/Topbar'
import WokerBottombar from './TransportWorker/Bottombar'
import PickerBottombar from './Picker/Bottombar'
import PendingTaskList from '../components/TaskList'
import PickerCreatedTaskList from './Picker/TaskListCard'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { TaskCategoryEnum } from '../types/task'

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const isPicker = userProfile.role === 'PICKER'
  const isAdmin = userProfile.role === 'ADMIN'
  const isTransportWorker = userProfile.role === 'TRANSPORT_WORKER'

  const [taskStatus, setTaskStatus] = useState(TaskCategoryEnum.PENDING)
  const navigate = useNavigate()

  const handleCreatWokerTask = () => {
    navigate('/my-task/scan-qr')
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
  if (isPicker) {
    return (
      <Box sx={{ height: '100vh', backgroundColor: '#F7F9FC' }}>
        <TopBar userName={`${userProfile.firstName} ${userProfile.lastName}`} />
        <Box sx={{ flex: 1, p: 2, pb: 8 }}>
          <PickerCreatedTaskList status={taskStatus} />
        </Box>

        <PickerBottombar
          onTaskListClick={() => {
            setTaskStatus(TaskCategoryEnum.PENDING)
          }}
          onArchivedClick={() => {
            setTaskStatus(TaskCategoryEnum.COMPLETED)
          }}
        />
      </Box>
    )
  }
  if (isTransportWorker) {
    if (userProfile.currentTask) {
      navigate('/task-detail')
    }
    return (
      <Box sx={{ height: '100vh', backgroundColor: '#F7F9FC' }}>
        <TopBar userName={`${userProfile.firstName} ${userProfile.lastName}`} />
        <Box sx={{ flex: 1, p: 2, pb: 8 }}>
          <PendingTaskList />
        </Box>

        <WokerBottombar
          onTaskListClick={() => {
            setTaskStatus(TaskCategoryEnum.PENDING)
          }}
          onCreateTaskClick={handleCreatWokerTask}
        />
      </Box>
    )
  }
  return <></>
}

export default Dashboard
