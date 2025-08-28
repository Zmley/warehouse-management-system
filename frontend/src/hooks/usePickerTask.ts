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

      if (res.data?.success) {
        return res
      } else {
        const code = res.data?.errorCode || 'UNKNOWN_ERROR'
        setError(code)
        return null
      }
    } catch (err: any) {
      const code = err?.response?.data?.errorCode || 'UNKNOWN_ERROR'
      setError(code)
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

      if (!result?.data?.success) {
        const code = result?.data?.errorCode || 'UNKNOWN_ERROR'
        const err = new Error(code)
        // @ts-expect-error
        err.code = code
        throw err
      }

      return result.data.task as CreateTaskPayload
    } catch (err: any) {
      const code =
        err?.response?.data?.errorCode || err?.code || 'UNKNOWN_ERROR'
      setError(code)
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
