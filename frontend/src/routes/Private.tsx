import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Dashboard from '../pages/userDashboard/Dashboard'
import Profile from '../pages/userDashboard/Profile'
import { useAuth } from '../hooks/useAuth'

const PrivateRoute: React.FC = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to='/' />
}

const PrivateRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path='/' element={<Dashboard />} />
        <Route path='/profile' element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default PrivateRoutes
