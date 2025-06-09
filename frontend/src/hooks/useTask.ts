import { useState } from 'react'
import { useTaskContext } from 'contexts/task'
import {
  acceptTask as acceptTaskAPI,
  cancelTask as cancelTaskAPI,
  releaseTask as releaseTaskAPI,
  getTasks
} from 'api/taskApi'
import { Task } from 'types/task'

export const useTask = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { fetchMyTask } = useTaskContext()
  const [tasks, setTasks] = useState<Task[]>([])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const result = await getTasks()
      setTasks(result)
    } catch (err) {
      console.error('❌ Error loading tasks', err)
    } finally {
      setIsLoading(false)
    }
  }

  const acceptTask = async (taskID: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await acceptTaskAPI(taskID)
      if (res?.success && res?.task) {
        return true
      } else {
        setError(res?.error || '❌ Failed to accept task.')
        return false
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || '❌ Failed to accept task'
      setError(msg)
      console.error('❌ Accept task failed:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const cancelMyTask = async (taskID: string) => {
    try {
      await cancelTaskAPI(taskID)
      await fetchTasks()
      console.log('Task cancelled and tasks refreshed')
    } catch (error) {
      console.error('❌ Failed to cancel task:', error)
      throw error
    }
  }

  const releaseTask = async (taskID: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await releaseTaskAPI(taskID)
      await fetchMyTask()
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err.message || '❌ Failed to release task'
      setError(message)
      console.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    acceptTask,
    cancelMyTask,
    isLoading,
    error,
    tasks,
    fetchTasks,
    releaseTask
  }
}
