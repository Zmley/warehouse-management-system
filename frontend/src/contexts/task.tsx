import React, { createContext, useContext, useEffect, useState } from 'react'
import { Task } from '../types/task'
import { getTasks, getMyTask } from '../api/taskApi'

export type PendingTaskContextType = {
  tasks: Task[]
  fetchTasks: () => void
  myTask: Task | null
  setMyTask: (task: Task) => void
  fetchMyTask: () => Promise<Task | null>
}

const TaskContext = createContext<PendingTaskContextType | undefined>(undefined)

export const useTaskContext = (): PendingTaskContextType => {
  const context = useContext(TaskContext)
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
  const [tasks, setTasks] = useState<Task[]>([])
  const [myTask, setMyTask] = useState<Task | null>(null)

  const fetchTasks = async () => {
    try {
      const tasks = await getTasks()
      setTasks(tasks)
    } catch (error) {
      console.error('Failed to fetch pending tasks:', error)
    }
  }

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

  useEffect(() => {
    fetchTasks()
  }, [])

  return (
    <TaskContext.Provider
      value={{
        tasks,
        fetchTasks,
        myTask,
        setMyTask,
        fetchMyTask
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}
