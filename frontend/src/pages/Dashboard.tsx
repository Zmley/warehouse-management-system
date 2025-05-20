import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
import TopBar from 'components/Topbar'
import WokerBottombar from './TransportWorker/Bottombar'
import PickerBottombar from './Picker/Bottombar'
import PendingTaskList from 'components/TaskList'
import PickerCreatedTaskList from './Picker/TaskListCard'
import { useAuth } from 'hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { TaskCategoryEnum } from 'types/task'
import { TransportWorkCartProvider } from 'contexts/cart'
import { useCart } from 'hooks/useCart'

const TransportWorkerContent: React.FC<{ userName: string }> = ({
  userName
}) => {
  const { isCartEmpty } = useCart()
  const navigate = useNavigate()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [taskStatus, setTaskStatus] = useState(TaskCategoryEnum.PENDING)
  const { userProfile } = useAuth()

  if (!userProfile.currentTask && isCartEmpty) {
  } else if (!isCartEmpty) {
    navigate('/my-task')
  } else if (userProfile.currentTask) {
    navigate('/task-detail')
  }

  return (
    <Box sx={{ height: '100vh', backgroundColor: '#F7F9FC' }}>
      <TopBar userName={userName} />

      <Box sx={{ flex: 1, p: 2, pb: 8 }}>
        <PendingTaskList />
      </Box>

      <WokerBottombar
        onTaskListClick={() => {
          setTaskStatus(TaskCategoryEnum.PENDING)
        }}
        onCreateTaskClick={() => navigate('/my-task/scan-qr')}
      />
    </Box>
  )
}

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const isPicker = userProfile.role === 'PICKER'
  const isAdmin = userProfile.role === 'ADMIN'
  const isTransportWorker = userProfile.role === 'TRANSPORT_WORKER'

  const [taskStatus, setTaskStatus] = useState(TaskCategoryEnum.PENDING)

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
    return (
      <TransportWorkCartProvider>
        <TransportWorkerContent
          userName={`${userProfile.firstName} ${userProfile.lastName}`}
        />
      </TransportWorkCartProvider>
    )
  }

  return <></>
}

export default Dashboard
