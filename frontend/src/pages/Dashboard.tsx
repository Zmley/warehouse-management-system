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
import QueryProductInline from 'pages/Picker/QueryProductInline'

const TOPBAR_HEIGHT = 64
const BOTTOMBAR_HEIGHT = 64

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

const ContentShell: React.FC<{
  topPad?: number
  children: React.ReactNode
}> = ({ topPad = 16, children }) => (
  <Box
    sx={{
      position: 'relative',
      height: `calc(100dvh - ${TOPBAR_HEIGHT + topPad}px - ${BOTTOMBAR_HEIGHT}px)`,
      mt: `${TOPBAR_HEIGHT + topPad}px`,
      mb: `${BOTTOMBAR_HEIGHT}px`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
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

      <ContentShell topPad={4}>
        {view === 'cart' && (
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Cart />
          </Box>
        )}

        {view === 'tasks' && (
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <PendingTaskList setView={setView as any} />
          </Box>
        )}

        {view === 'inventory' && (
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <InventoryPage />
          </Box>
        )}

        {/* ★ 新增：产品查询页 */}
        {view === 'query' && (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <QueryProductInline />
          </Box>
        )}
      </ContentShell>

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
          onQueryClick={() => setView('query')}
          activeTab={view} //
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
        <Box
          sx={{
            position: 'fixed',
            top: `${TOPBAR_HEIGHT + 16}px`,
            bottom: `${BOTTOMBAR_HEIGHT}px`,
            left: 0,
            right: 0,
            overflow: 'hidden',
            backgroundColor: '#F7F9FC',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {pickerView === 'inventory' ? (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <QueryProductInline />
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <PickerCreatedTaskList status={taskStatus} />
            </Box>
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
