// ✅ src/contexts/PendingTaskContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Task } from '../types/task'
import { getPendingTasks, getCurrentInProcessTask } from '../api/taskApi'

export type PendingTaskContextType = {
  pendingTasks: Task[]
  refreshPendingTasks: () => void
  inProcessTask: Task | null
  setInProcessTask: (task: Task) => void
  fetchInProcessTask: () => Promise<Task | null>
}

const PendingTaskContext = createContext<PendingTaskContextType | undefined>(
  undefined
)

export const usePendingTaskContext = (): PendingTaskContextType => {
  const context = useContext(PendingTaskContext)
  if (!context) {
    throw new Error(
      'usePendingTaskContext must be used within PendingTaskProvider'
    )
  }
  return context
}

export const PendingTaskProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [inProcessTask, setInProcessTask] = useState<Task | null>(null)

  const refreshPendingTasks = async () => {
    try {
      const tasks = await getPendingTasks()
      setPendingTasks(tasks)
    } catch (error) {
      console.error('Failed to fetch pending tasks:', error)
    }
  }

  const fetchInProcessTask = async (): Promise<Task | null> => {
    try {
      const task = await getCurrentInProcessTask()
      setInProcessTask(task)
      return task
    } catch (error) {
      console.error('❌ Failed to fetch in-process task:', error)
      return null
    }
  }

  useEffect(() => {
    refreshPendingTasks()
  }, [])

  return (
    <PendingTaskContext.Provider
      value={{
        pendingTasks,
        refreshPendingTasks,
        inProcessTask,
        setInProcessTask,
        fetchInProcessTask
      }}
    >
      {children}
    </PendingTaskContext.Provider>
  )
}

// ✅ src/components/PendingTaskList.tsx
