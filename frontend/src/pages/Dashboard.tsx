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
import QueryProductInline from 'pages/Picker/SearchProduct'

const TOPBAR_HEIGHT = 64
const BOTTOMBAR_HEIGHT = 64

const TopBarFixed = ({ userName }: { userName: string }) => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: TOPBAR_HEIGHT,
      zIndex: 1300,
      backgroundColor: '#f9fafb'
    }}
  >
    <TopBar userName={userName} />
  </Box>
)

const ContentArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      position: 'fixed',
      top: TOPBAR_HEIGHT,
      bottom: BOTTOMBAR_HEIGHT,
      left: 0,
      right: 0,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      backgroundColor: '#F7F9FC',
      px: 0,
      pt: 1.5,
      pb: 'calc(env(safe-area-inset-bottom, 0px) + 8px)'
    }}
  >
    {children}
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

  const [view, setView] = useState<'cart' | 'tasks' | 'inventory' | 'query'>(
    defaultView
  )

  useEffect(() => {
    if (!isCartEmpty) setView('cart')
  }, [isCartEmpty])

  return (
    <Box sx={{ height: '100dvh', backgroundColor: '#F7F9FC' }}>
      <TopBarFixed userName={userName} />

      <ContentArea>
        {view === 'cart' && <Cart />}
        {view === 'tasks' && <PendingTaskList setView={setView as any} />}
        {view === 'inventory' && <InventoryPage />}
        {view === 'query' && <QueryProductInline />}
      </ContentArea>

      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: BOTTOMBAR_HEIGHT,
          backgroundColor: '#fff',
          zIndex: 1300,
          pb: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <WokerBottombar
          onCartClick={() => setView('cart')}
          onTaskListClick={() => setView('tasks')}
          onInventoryClick={() => setView('inventory')}
          onPublishClick={() => navigate('/picker-scan-bin')}
          onQueryClick={() => setView('query')}
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

  if (isPicker) {
    return (
      <Box sx={{ height: '100dvh', backgroundColor: '#F7F9FC' }}>
        <TopBarFixed
          userName={`${userProfile.firstName} ${userProfile.lastName}`}
        />

        <ContentArea>
          {pickerView === 'inventory' ? (
            <QueryProductInline />
          ) : (
            <PickerCreatedTaskList status={taskStatus} />
          )}
        </ContentArea>

        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: BOTTOMBAR_HEIGHT,
            backgroundColor: '#fff',
            zIndex: 1300,
            pb: 'env(safe-area-inset-bottom, 0px)'
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
