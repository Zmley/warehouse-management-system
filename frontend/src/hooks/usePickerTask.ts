import { useState, useEffect } from 'react'
import {
  createPickerTask,
  getPickerCreatedTasks,
  cancelPickerTask
} from '../api/taskApi'
import { Task } from '../types/task'

export const useCreatePickerTask = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTask = async (
    binCode: string,
    productCode: string
  ): Promise<Task | null> => {
    setLoading(true)
    setError(null)
    try {
      const task = await createPickerTask(binCode, productCode)
      return task
    } catch (err) {
      setError('Failed to create task')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createTask, loading, error }
}

export const usePickerCreatedTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const tasks = await getPickerCreatedTasks()
      setTasks(tasks)
    } catch (err) {
      setError('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  return { tasks, loading, error }
}

export const useCancelPickerTask = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancelTask = async (taskID: string): Promise<Task | null> => {
    setLoading(true)
    setError(null)
    try {
      const task = await cancelPickerTask(taskID)
      return task
    } catch (err) {
      setError('Failed to cancel task')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { cancelTask, loading, error }
}
