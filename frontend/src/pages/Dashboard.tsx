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

const TOPBAR_HEIGHT = 64
const BOTTOMBAR_HEIGHT = 64

// ✅ 顶部固定 TopBar
const TopBarFixed = ({ userName }: { userName: string }) => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: `${TOPBAR_HEIGHT}px`,
      zIndex: 1300,
      backgroundColor: '#f9fafb'
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
    <Box sx={{ height: '100vh', backgroundColor: '#F7F9FC' }}>
      <TopBarFixed userName={userName} />

      <Box
        sx={{
          paddingTop: `${TOPBAR_HEIGHT + 4}px`,
          paddingBottom: `${BOTTOMBAR_HEIGHT}px`,
          height: '100vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {view === 'cart' && <Cart />}
        {view === 'tasks' && <PendingTaskList setView={setView} />}
        {view === 'inventory' && <InventoryPage />}
      </Box>

      {/* ✅ 底部固定条 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${BOTTOMBAR_HEIGHT}px`,
          backgroundColor: '#fff',
          zIndex: 1300
        }}
      >
        <WokerBottombar
          onCartClick={() => setView('cart')}
          onTaskListClick={() => setView('tasks')}
          onInventoryClick={() => setView('inventory')}
          onPublishClick={() => navigate('/picker-scan-bin')}
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
  const [pickerView, setPickerView] = useState<
    'task' | 'archived' | 'inventory'
  >('task')
  const navigate = useNavigate()

  // —— Picker 视图 —— //
  if (isPicker) {
    return (
      <Box sx={{ height: '100vh', backgroundColor: '#F7F9FC' }}>
        <TopBarFixed
          userName={`${userProfile.firstName} ${userProfile.lastName}`}
        />

        <Box
          sx={{
            paddingTop: `${TOPBAR_HEIGHT + 16}px`,
            paddingBottom: `${BOTTOMBAR_HEIGHT}px`,
            height: '100vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {pickerView === 'inventory' ? (
            <InventoryPage />
          ) : (
            <PickerCreatedTaskList status={taskStatus} />
          )}
        </Box>

        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${BOTTOMBAR_HEIGHT}px`,
            backgroundColor: '#fff',
            zIndex: 1300
          }}
        >
          <PickerBottombar
            selectedView={pickerView}
            onTaskListClick={() => {
              setPickerView('task')
              setTaskStatus(TaskCategoryEnum.PENDING)
            }}
            onArchivedClick={() => {
              setPickerView('archived')
              setTaskStatus(TaskCategoryEnum.COMPLETED)
            }}
            onCreateTaskClick={() => navigate('/picker-scan-bin')}
            onInventoryClick={() => setPickerView('inventory')}
          />
        </Box>
      </Box>
    )
  }

  // —— Transport Worker 视图 —— //
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
