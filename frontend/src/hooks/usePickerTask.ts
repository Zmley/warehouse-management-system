import { useState } from 'react'
import { createPickerTask, getPickerTasks, cancelPickerTask } from 'api/task'
import { Task } from 'types/task'
import { useAuth } from 'hooks/useAuth'

export const usePickerTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { userProfile } = useAuth()

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPickerTasks()
      setTasks(res.data.tasks || [])
    } catch (err) {
      setError('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (
    destinationBinCode: string,
    productCode: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const res = await createPickerTask({
        destinationBinCode,
        productCode,
        warehouseID: userProfile.warehouseID
      })

      if (res.data.success) {
        return res
      } else {
        setError(res.data.error || '❌ Failed to create task')
        return null
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error || err.message || '❌ Unexpected error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const cancelTask = async (taskID: string): Promise<Task | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await cancelPickerTask(taskID)
      return res.data.task || null
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
