import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Profile from '../pages/Profile'
import ScanTask from '../pages/TransportWorker/ScanTask'
import InProcessPage from '../pages/TransportWorker/InProcessPage'
import { useContext, useEffect } from 'react'
import { AuthContext } from '../contexts/auth'
import Dashboard from '../pages/Dashboard'
import { useCargoContext } from '../contexts/cargo'

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
    </Routes>
  )
}

export default PrivateRoutes
