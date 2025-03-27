import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/auth'
import { CartProvider } from './contexts/cart'
import { BinCodeProvider } from './contexts/binCode'
import PublicRoute from './routes/PublicRoute'

import { PendingTaskProvider } from './contexts/pendingTask'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <PendingTaskProvider>
          <BinCodeProvider>
            <CartProvider>
              <PublicRoute />
            </CartProvider>
          </BinCodeProvider>
        </PendingTaskProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
