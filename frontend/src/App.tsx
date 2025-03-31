import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/auth'
import { CartProvider } from './contexts/cart'
import { TaskProvider } from './contexts/task'
import PublicRoute from './routes/PublicRoute'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <TaskProvider>
          <CartProvider>
            <PublicRoute />
          </CartProvider>
        </TaskProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
