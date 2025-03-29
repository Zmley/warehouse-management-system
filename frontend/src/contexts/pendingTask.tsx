import React, { createContext, useContext, useEffect, useState } from 'react'
import { Task } from '../types/task'
import { getPendingTasks, getCurrentInProcessTask } from '../api/taskApi'

export type PendingTaskContextType = {
  pendingTasks: Task[]
  fetchPendingTasks: () => void
  myTask: Task | null
  setMyTask: (task: Task) => void
  fetchMyTask: () => Promise<Task | null>
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
  const [myTask, setMyTask] = useState<Task | null>(null)

  const fetchPendingTasks = async () => {
    try {
      const tasks = await getPendingTasks()
      setPendingTasks(tasks)
    } catch (error) {
      console.error('Failed to fetch pending tasks:', error)
    }
  }

  const fetchMyTask = async (): Promise<Task | null> => {
    try {
      const task = await getCurrentInProcessTask()
      setMyTask(task)
      return task
    } catch (error) {
      console.error('❌ Failed to fetch in-process task:', error)
      return null
    }
  }

  useEffect(() => {
    fetchPendingTasks()
  }, [])

  return (
    <PendingTaskContext.Provider
      value={{
        pendingTasks,
        fetchPendingTasks,
        myTask,
        setMyTask,
        fetchMyTask
      }}
    >
      {children}
    </PendingTaskContext.Provider>
  )
}
