// src/contexts/pendingTask.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Task } from '../types/task'
import { getPendingTasks } from '../api/taskApi'

interface PendingTaskContextType {
  pendingTasks: Task[]
  refreshPendingTasks: () => void
}

const PendingTaskContext = createContext<PendingTaskContextType | undefined>(
  undefined
)

export const usePendingTaskContext = () => {
  const context = useContext(PendingTaskContext)
  if (!context) {
    throw new Error(
      'usePendingTaskContext must be used inside PendingTaskProvider'
    )
  }
  return context
}

export const PendingTaskProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])

  const refreshPendingTasks = async () => {
    try {
      const tasks = await getPendingTasks()
      setPendingTasks(tasks)
    } catch (error) {
      console.error('Failed to fetch pending tasks:', error)
    }
  }

  useEffect(() => {
    refreshPendingTasks()
  }, [])

  return (
    <PendingTaskContext.Provider value={{ pendingTasks, refreshPendingTasks }}>
      {children}
    </PendingTaskContext.Provider>
  )
}
