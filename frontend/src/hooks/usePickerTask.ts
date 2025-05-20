import { useState } from 'react'
import { createPickerTask, getPickerTasks, cancelPickerTask } from 'api/taskApi'
import { Task } from 'types/task'
import { useAuth } from 'hooks/useAuth'

import { useEffect } from 'react'

export const useAutoRefresh = (refreshFn: () => void, intervalMs = 30000) => {
  useEffect(() => {
    refreshFn()

    const interval = setInterval(() => {
      refreshFn()
    }, intervalMs)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshFn()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}

export const usePickerTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { userProfile } = useAuth()

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

      if (res.success) {
        return res
      } else {
        setError(res.error || '❌ Failed to create task')
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
    cancelTask,
    useAutoRefresh
  }
}
