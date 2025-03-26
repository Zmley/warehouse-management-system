import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/auth'
import { CartProvider } from './contexts/cart'
import { BinCodeProvider } from './contexts/binCode'
import PublicRoute from './routes/PublicRoute'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <BinCodeProvider>
          <CartProvider>
            <PublicRoute />
          </CartProvider>
        </BinCodeProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
