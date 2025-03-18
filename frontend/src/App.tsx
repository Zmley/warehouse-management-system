import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/auth'
import PublicRoutes from './routes/PublicRoutes'
import PrivateRoutes from './routes/privateRoutes'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <PublicRoutes />
        <PrivateRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
