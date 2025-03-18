import React, { useContext } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthContext } from '../contexts/authContext'
import Dashboard from '../pages/userDashboard/Dashboard'
import Profile from '../pages/userDashboard/Profile'

const PrivateRoute: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext)!
  return isAuthenticated ? <Outlet /> : <Navigate to='/' />
}

const PrivateRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/Profile' element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default PrivateRoutes
