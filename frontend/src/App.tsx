import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import PublicRoute from 'routes/PublicRoute'
import { AuthProvider } from 'contexts/auth'
import { TaskProvider } from 'contexts/task'

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
