import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Profile from '../pages/userDashboard/Profile'
import { useContext, useEffect } from 'react'
import { AuthContext } from '../contexts/auth'

const PrivateRoute: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext)!

  return isAuthenticated ? <Outlet /> : <Navigate to='/' />
}

const PrivateRoutes: React.FC = () => {
  const { getMe } = useContext(AuthContext)!
  useEffect(() => {
    getMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path='/profile' element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default PrivateRoutes
