import { useState } from 'react'
import {
  createPickerTask,
  getPickerTasks,
  cancelPickerTask
} from '../api/taskApi'
import { Task } from '../types/task'

export const usePickerTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const tasks = await getPickerTasks()
      setTasks(tasks)
    } catch (err) {
      setError('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

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

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    cancelTask
  }
}
