import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Profile from '../pages/Profile'
import ScanTask from '../pages/TransportWorker/ScanQRCode'
import Cart from '../pages/TransportWorker/Cart'
import UnloadSuccess from '../pages/TransportWorker/Success'
import { useContext, useEffect } from 'react'
import { AuthContext } from '../contexts/auth'
import Dashboard from '../pages/Dashboard'
import TaskDetailPage from '../pages/TransportWorker/TaskDetailPage'

import { useCartContext } from '../contexts/cart'

const PrivateRoutes: React.FC = () => {
  const { getMe } = useContext(AuthContext)!
  useEffect(() => {
    getMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { isCartEmpty } = useCartContext()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (
      !isCartEmpty &&
      location.pathname !== '/my-task' &&
      location.pathname !== '/scan-qr'
    ) {
      navigate('/my-task')
    }
  }, [isCartEmpty, location.pathname, navigate])

  return (
    <Routes>
      <Route path='/' element={<Dashboard />} />
      <Route path='/profile' element={<Profile />} />
      <Route path='/scan-qr' element={<ScanTask />} />
      <Route path='/my-task' element={<Cart />} />
      <Route path='/success' element={<UnloadSuccess />} />

      <Route path='/task-detail' element={<TaskDetailPage />} />
    </Routes>
  )
}

export default PrivateRoutes
