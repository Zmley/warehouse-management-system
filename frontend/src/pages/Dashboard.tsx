import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import TopBar from 'components/Topbar'
import WokerBottombar from './TransportWorker/components/WokerBottomBar'
import PickerBottombar from './Picker/PickerBottombar'
import PendingTaskList from 'pages/TransportWorker/TaskList'
import PickerCreatedTaskList from './Picker/TaskListCard'
import { useAuth } from 'hooks/useAuth'
import { TaskCategoryEnum } from 'constants/index'
import { TransportWorkCartProvider } from 'contexts/cart'
import { useCart } from 'hooks/useCart'
import Cart from 'pages/TransportWorker/Cart'
import InventoryPage from 'pages/TransportWorker/Inventory'
import { useLocation, useNavigate } from 'react-router-dom'

const TopBarFixed = ({ userName }: { userName: string }) => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1300,
      backgroundColor: '#fff',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)'
    }}
  >
    <TopBar userName={userName} />
  </Box>
)

const TransportWorkerContent: React.FC<{ userName: string }> = ({
  userName
}) => {
  const { isCartEmpty } = useCart()
  const location = useLocation()
  const navigate = useNavigate()

  const defaultView =
    location.state?.view === 'cart' ? 'cart' : isCartEmpty ? 'tasks' : 'cart'

  const [view, setView] = useState<'cart' | 'tasks' | 'inventory'>(defaultView)

  useEffect(() => {
    if (!isCartEmpty) {
      setView('cart')
    }
  }, [isCartEmpty])

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#F7F9FC',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <TopBarFixed userName={userName} />

      <Box
        sx={{
          flex: 1,
          pt: '72px', // TopBar 避让
          pb: '90px', // BottomBar 避让
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {view === 'cart' && <Cart />}
        {view === 'tasks' && <PendingTaskList setView={setView} />}
        {view === 'inventory' && <InventoryPage />}
      </Box>

      <Box sx={{ zIndex: 1300 }}>
        <WokerBottombar
          onCartClick={() => setView('cart')}
          onTaskListClick={() => setView('tasks')}
          onInventoryClick={() => setView('inventory')}
          onPublishClick={() => navigate('/picker-scan-bin')}
          // onCompletedTaskClick={() => {}}
          activeTab={view}
        />
      </Box>
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
            pb: '90px',
            height: '100vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <PickerCreatedTaskList status={taskStatus} />
        </Box>
        <Box sx={{ zIndex: 1300 }}>
          <PickerBottombar
            selectedView={
              taskStatus === TaskCategoryEnum.PENDING ? 'task' : 'archived'
            }
            onTaskListClick={() => setTaskStatus(TaskCategoryEnum.PENDING)}
            onArchivedClick={() => setTaskStatus(TaskCategoryEnum.COMPLETED)}
            onCreateTaskClick={() => navigate('/picker-scan-bin')}
          />
        </Box>
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

  return null
}

export default Dashboard
