import React, { useContext, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthContext } from '../contexts/auth'
import LoginPage from '../pages/Login'
import Dashboard from '../pages/userDashboard/Dashboard'
import Profile from '../pages/userDashboard/Profile'

const PublicRoute: React.FC = () => {
  const { isAuthenticated, getMe } = useContext(AuthContext)!

  useEffect(() => {
    if (isAuthenticated) {
      getMe();  
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Dashboard /> : <LoginPage />} />
      {isAuthenticated && <Route path="/profile" element={<Profile />} />}
    </Routes>
  )
}

export default PublicRoute