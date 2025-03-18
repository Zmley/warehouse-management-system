import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext } from '../contexts/auth'
import LoginPage from '../pages/Login'

const PublicRoutes: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext)!

  return (
    <Routes>
      <Route
        path='/'
        element={isAuthenticated ? <Navigate to='/dashboard' /> : <LoginPage />}
      />
    </Routes>
  )
}

export default PublicRoutes
