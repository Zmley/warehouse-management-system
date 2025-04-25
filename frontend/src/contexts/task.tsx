import React, { createContext, useContext, useState } from 'react'
import { Task } from 'types/task'
import { getTasks, getMyTask } from 'api/taskApi'

export type TaskContextType = {
  tasks: Task[]
  fetchTasks: () => void
  myTask: Task | null
  setMyTask: (task: Task) => void
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
  const [tasks, setTasks] = useState<Task[]>([])
  const [myTask, setMyTask] = useState<Task | null>(null)

  const fetchTasks = async () => {
    try {
      const tasks = await getTasks()
      setTasks(tasks)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
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
