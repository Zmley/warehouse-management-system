import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskContext } from 'contexts/task'
import {
  acceptTask as acceptTaskAPI,
  cancelTask as cancelTaskAPI
} from 'api/taskApi'

export const useTask = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { fetchMyTask, fetchTasks } = useTaskContext()
  const navigate = useNavigate()

  const acceptTask = async (taskID: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await acceptTaskAPI(taskID)
      if (res?.task) {
        await fetchMyTask()
        navigate('/task-detail')
      } else {
        setError('Task accept API did not return a task.')
      }
    } catch (err) {
      setError('❌ Failed to accept task')
      console.error(err)
    } finally {
      setLoading(false)
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
    loading,
    error
  }
}
