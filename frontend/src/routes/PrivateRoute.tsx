import { Routes, Route, Outlet } from 'react-router-dom'
import Profile from 'pages/Profile'
import ScanQRCode from 'pages/TransportWorker/Scan'
import Cart from 'pages/TransportWorker/Cart'
import UnloadSuccess from 'pages/Success'
import { useContext, useEffect } from 'react'
import { AuthContext } from 'contexts/auth'
import Dashboard from 'pages/Dashboard'
import TaskDetailPage from 'pages/TransportWorker/TaskDetail'
import PickerScanPage from 'pages/Picker/Scan'
import CreateTaskPage from 'pages/Picker/CreateTask'

import { TransportWorkCartProvider } from 'contexts/cart'

const PrivateRoutes: React.FC = () => {
  const { getMe } = useContext(AuthContext)!
  useEffect(() => {
    getMe()
  }, [])

  return (
    <Routes>
      <Route path='/' element={<Dashboard />} />
      <Route path='/profile' element={<Profile />} />
      <Route
        path='/my-task'
        element={
          <TransportWorkCartProvider>
            <Outlet />
          </TransportWorkCartProvider>
        }
      >
        <Route index element={<Cart />} />
        <Route path='scan-qr' element={<ScanQRCode />} />
      </Route>
      <Route path='/success' element={<UnloadSuccess />} />

      <Route path='/task-detail' element={<TaskDetailPage />} />

      <Route path='/picker-scan-bin' element={<PickerScanPage />} />
      <Route path='/create-task' element={<CreateTaskPage />} />
    </Routes>
  )
}

export default PrivateRoutes
