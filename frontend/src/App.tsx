import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/auth'
import { TaskProvider } from './contexts/task'
import PublicRoute from './routes/PublicRoute'

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <TaskProvider>
          <PublicRoute />
        </TaskProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
