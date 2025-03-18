import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

import LoginPage from '../pages/Login'
import Dashboard from '../pages/userDashboard/Dashboard'
import Profile from '../pages/userDashboard/Profile'

const PublicRoute: React.FC = () => {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Dashboard /> : <LoginPage />} />
      {isAuthenticated && <Route path="/profile" element={<Profile />} />}
    </Routes>
  )
}

export default PublicRoute