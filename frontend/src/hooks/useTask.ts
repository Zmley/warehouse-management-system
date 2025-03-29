import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePendingTaskContext } from '../contexts/pendingTask'
import { acceptTask as acceptTaskAPI, cancelTask } from '../api/taskApi'

export const useTask = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { fetchMyTask, fetchPendingTasks: refreshPendingTasks } =
    usePendingTaskContext()
  const navigate = useNavigate()

  // Task Accept Logic
  const acceptTask = async (taskID: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await acceptTaskAPI(taskID)
      if (res?.task) {
        await fetchMyTask()
        navigate('/task-detail')
      } else {
        setError('⚠️ Task accept API did not return a task.')
      }
    } catch (err) {
      setError('❌ Failed to accept task')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Task Cancel Logic
  const cancelCurrentTask = async (taskID: string) => {
    try {
      await cancelTask(taskID)
      await refreshPendingTasks()
      console.log('Task cancelled and pending tasks refreshed')
    } catch (error) {
      console.error('❌ Failed to cancel task:', error)
      throw error
    }
  }

  return {
    acceptTask,
    cancelCurrentTask,
    loading,
    error
  }
}
