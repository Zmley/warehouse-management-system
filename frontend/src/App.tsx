import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/auth'
import { CartProvider } from './contexts/cart'
import { PendingTaskProvider } from './contexts/pendingTask'
import PublicRoute from './routes/PublicRoute'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <PendingTaskProvider>
          <CartProvider>
            <PublicRoute />
          </CartProvider>
        </PendingTaskProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
