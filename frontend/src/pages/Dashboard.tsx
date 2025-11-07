import React, { useEffect, useMemo, useState } from 'react'
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
import InventoryPage from 'pages/TransportWorker/inventory/index'
import { useLocation, useNavigate } from 'react-router-dom'
import QueryProductInline from 'pages/Picker/SearchProduct'

export const TOPBAR_HEIGHT = 54
export const BOTTOMBAR_HEIGHT = 80

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
    <TopBar />
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
      flexDirection: 'column',
      backgroundColor: '#F7F9FC'
    }}
  >
    {children}
  </Box>
)

const ScrollPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      touchAction: 'pan-y',
      backgroundColor: '#F7F9FC'
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

  const defaultView = useMemo<'cart' | 'tasks' | 'inventory' | 'query'>(() => {
    if (location.state?.view === 'cart') return 'cart'
    return isCartEmpty ? 'tasks' : 'cart'
  }, [location.state, isCartEmpty])

  const [view, setView] = useState<'cart' | 'tasks' | 'inventory' | 'query'>(
    defaultView
  )

  useEffect(() => {
    if (!isCartEmpty) setView('cart')
  }, [isCartEmpty])

  const goCart = React.useCallback(() => setView('cart'), [])
  const goTasks = React.useCallback(() => setView('tasks'), [])
  const goInventory = React.useCallback(() => setView('inventory'), [])
  const goQuery = React.useCallback(() => setView('query'), [])
  const goPublish = React.useCallback(
    () => navigate('/picker-scan-bin'),
    [navigate]
  )

  return (
    <Box sx={{ height: '100dvh', backgroundColor: '#F7F9FC' }}>
      <TopBarFixed userName={userName} />

      <ContentShell topPad={4}>
        {view === 'cart' && (
          <ScrollPanel>
            <Cart />
          </ScrollPanel>
        )}

        {view === 'tasks' && (
          <ScrollPanel>
            <PendingTaskList setView={setView as any} />
          </ScrollPanel>
        )}

        {view === 'inventory' && (
          <ScrollPanel>
            <InventoryPage />
          </ScrollPanel>
        )}

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
          zIndex: 1300,
          pb: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <WokerBottombar
          onCartClick={goCart}
          onTaskListClick={goTasks}
          onInventoryClick={goInventory}
          onPublishClick={goPublish}
          onQueryClick={goQuery}
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
            <ScrollPanel>
              <PickerCreatedTaskList status={taskStatus} />
            </ScrollPanel>
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
