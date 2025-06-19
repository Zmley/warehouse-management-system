import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import TopBar from 'components/Topbar'
import WokerBottombar from './TransportWorker/WokerBottomBar'
import PickerBottombar from './Picker/PickerBottombar'
import PendingTaskList from 'components/TaskList'
import PickerCreatedTaskList from './Picker/TaskListCard'
import { useAuth } from 'hooks/useAuth'
import { TaskCategoryEnum } from 'constants/index'
import { TransportWorkCartProvider } from 'contexts/cart'
import { useCart } from 'hooks/useCart'
import Cart from 'pages/TransportWorker/Cart'
import { useNavigate } from 'react-router-dom'

const TopBarFixed = ({ userName }: { userName: string }) => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1200,
      backgroundColor: '#FFF',
      boxShadow: '0px 2px 4px #0000001A'
    }}
  >
    <TopBar userName={userName} />
  </Box>
)

const TransportWorkerContent: React.FC<{ userName: string }> = ({
  userName
}) => {
  const { isCartEmpty } = useCart()
  const [view, setView] = useState<'cart' | 'task'>(
    isCartEmpty ? 'task' : 'cart'
  )

  const navigate = useNavigate()

  useEffect(() => {
    if (!isCartEmpty) {
      setView('cart')
    }
  }, [isCartEmpty])

  return (
    <Box
      sx={{ height: '100vh', backgroundColor: '#F7F9FC', overflow: 'hidden' }}
    >
      <TopBarFixed userName={userName} />

      <Box sx={{ pt: '72px', pb: '80px', height: '100vh' }}>
        {view === 'cart' ? <Cart /> : <PendingTaskList setView={setView} />}
      </Box>

      <WokerBottombar
        onCartClick={() => setView('cart')}
        onTaskListClick={() => setView('task')}
        onPublishClick={() => navigate('/picker-scan-bin')}
      />
    </Box>
  )
}

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const isPicker = userProfile.role === 'PICKER'
  const isTransportWorker = userProfile.role === 'TRANSPORT_WORKER'
  const [taskStatus, setTaskStatus] = useState(TaskCategoryEnum.PENDING)

  const navigate = useNavigate()

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
          selectedView={
            taskStatus === TaskCategoryEnum.PENDING ? 'task' : 'archived'
          }
          onTaskListClick={() => setTaskStatus(TaskCategoryEnum.PENDING)}
          onArchivedClick={() => setTaskStatus(TaskCategoryEnum.COMPLETED)}
          onCreateTaskClick={() => navigate('/picker-scan-bin')}
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
