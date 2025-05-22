import React, { useEffect, useState } from 'react'
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

const TopBarFixed = ({ userName }: { userName: string }) => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1200,
      backgroundColor: '#FFF',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
    }}
  >
    <TopBar userName={userName} />
  </Box>
)

const TransportWorkerContent: React.FC<{ userName: string }> = ({
  userName
}) => {
  const { isCartEmpty } = useCart()
  const { userProfile } = useAuth()
  const navigate = useNavigate()

  // useEffect(() => {
  //   if (userProfile.currentTask) {
  //     navigate('/task-detail')
  //   } else if (!isCartEmpty) {
  //     navigate('/my-task')
  //   }
  // }, [userProfile.currentTask, isCartEmpty, navigate])

  return (
    <Box
      sx={{ height: '100vh', backgroundColor: '#F7F9FC', overflow: 'hidden' }}
    >
      <TopBarFixed userName={userName} />
      <Box
        sx={{
          pt: '72px',
          pb: '80px',
          height: '100vh'
        }}
      >
        <PendingTaskList />
      </Box>
      <WokerBottombar
        onCreatePickTaskClick={() => navigate('/picker-scan-bin')}
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
      <Box
        sx={{ height: '100vh', backgroundColor: '#F7F9FC', overflow: 'hidden' }}
      >
        <TopBarFixed
          userName={`${userProfile.firstName} ${userProfile.lastName}`}
        />
        <Box
          sx={{
            pt: '72px',
            pb: '80px',
            height: '100vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <PickerCreatedTaskList status={taskStatus} />
        </Box>
        <PickerBottombar
          onTaskListClick={() => setTaskStatus(TaskCategoryEnum.PENDING)}
          onArchivedClick={() => setTaskStatus(TaskCategoryEnum.COMPLETED)}
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
