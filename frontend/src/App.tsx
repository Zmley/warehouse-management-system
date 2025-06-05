import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import PublicRoute from './routes/PublicRoute'
import { AuthProvider } from 'contexts/auth'
import { TaskProvider } from 'contexts/task'
//改pr 全局搜索./ 你把./去掉 我帮你把tfconfig改好了，路径这里应该不需要./了

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
