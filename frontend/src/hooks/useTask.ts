import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskContext } from 'contexts/task'
import {
  acceptTask as acceptTaskAPI,
  cancelTask as cancelTaskAPI,
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

  const acceptTask = async (taskID: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await acceptTaskAPI(taskID)
      if (res?.task) {
        await fetchMyTask()
      } else {
        setError('❌ API did not return task object.')
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err.message ||
        '❌ Failed to accept task'
      setError(msg)
      console.error('❌ Accept task failed:', err)
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

  return {
    acceptTask,
    cancelMyTask,
    isLoading,
    error,
    tasks,
    fetchTasks
  }
}
