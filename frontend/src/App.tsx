import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/auth'
import { CartProvider } from './contexts/cart'
import { WorkerTaskProvider } from './contexts/workerTask'
import PublicRoute from './routes/PublicRoute'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <WorkerTaskProvider>
          <CartProvider>
            <PublicRoute />
          </CartProvider>
        </WorkerTaskProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
