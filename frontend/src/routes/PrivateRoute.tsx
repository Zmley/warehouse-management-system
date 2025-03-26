import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Profile from '../pages/Profile'
import ScanTask from '../pages/TransportWorker/ScanQRCode'
import InProcessPage from '../pages/TransportWorker/Cart'
import UnloadSuccess from '../pages/TransportWorker/UnloadSuccess'
import TaskDetailPage from '../pages/TransportWorker/TaskDetailPage'
import { useContext, useEffect } from 'react'
import { AuthContext } from '../contexts/auth'
import Dashboard from '../pages/Dashboard'
import { useCargoContext } from '../contexts/cart'

const PrivateRoutes: React.FC = () => {
  const { getMe } = useContext(AuthContext)!
  useEffect(() => {
    getMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { hasCargoInCar } = useCargoContext()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (
      hasCargoInCar &&
      location.pathname !== '/in-process-task' &&
      location.pathname !== '/scan-qr'
    ) {
      navigate('/in-process-task')
    }
  }, [hasCargoInCar, location.pathname, navigate])

  return (
    <Routes>
      <Route path='/' element={<Dashboard />} />
      <Route path='/profile' element={<Profile />} />
      <Route path='/scan-qr' element={<ScanTask />} />
      <Route path='/in-process-task' element={<InProcessPage />} />
      <Route path='/success' element={<UnloadSuccess />} />
      <Route path='/task/:taskID' element={<TaskDetailPage />} />
    </Routes>
  )
}

export default PrivateRoutes
