import React, { createContext, useContext, useState } from 'react'
import { Task } from 'types/task'
import { getMyTask } from 'api/taskApi'

export type TaskContextType = {
  myTask: Task | null
  setMyTask: (task: Task | null) => void
  fetchMyTask: () => Promise<Task | null>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export const useTaskContext = (): TaskContextType => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider')
  }
  return context
}

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [myTask, setMyTask] = useState<Task | null>(null)

  const fetchMyTask = async (): Promise<Task | null> => {
    try {
      const task = await getMyTask()
      setMyTask(task)
      return task
    } catch (error) {
      console.error('❌ Failed to fetch in-process task:', error)
      return null
    }
  }

  return (
    <TaskContext.Provider
      value={{
        myTask,
        setMyTask,
        fetchMyTask
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}
