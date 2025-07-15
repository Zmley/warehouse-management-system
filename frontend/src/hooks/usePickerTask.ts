import { useState } from 'react'
import { createPickerTask, getPickerTasks, cancelPickerTask } from 'api/task'
import { CreateTaskPayload, Task } from 'types/task'
import { useAuth } from 'hooks/useAuth'

export const usePickerTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { userProfile } = useAuth()

  const fetchTasks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getPickerTasks()
      setTasks(res.data.tasks || [])
    } catch (err) {
      setError('Failed to fetch tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const createTask = async (
    destinationBinCode: string,
    productCode: string
  ) => {
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const cancelTask = async (taskID: string): Promise<Task | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await cancelPickerTask(taskID)
      return res.data.task || null
    } catch (err) {
      setError('Failed to cancel task')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const createPickTask = async (
    productCode: string,
    destinationBinCode: string
  ): Promise<CreateTaskPayload | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createPickerTask({
        productCode,
        warehouseID: userProfile.warehouseID,
        destinationBinCode
      })

      if (!result.data?.success) {
        const backendError =
          result.data?.error || '❌ Pick task creation failed'
        throw new Error(backendError)
      }

      return result.data.task
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || '❌ Failed to create task'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    tasks,
    isLoading,
    setError,
    error,
    fetchTasks,
    createTask,
    cancelTask,
    createPickTask
  }
}
