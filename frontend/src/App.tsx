import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/auth'
import { CargoProvider } from './contexts/cargo'
import { PendingTaskProvider } from './contexts/pendingTask'
import PublicRoute from './routes/PublicRoute'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <PendingTaskProvider>
          <CargoProvider>
            <PublicRoute />
          </CargoProvider>
        </PendingTaskProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
