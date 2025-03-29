import { usePendingTaskContext } from '../contexts/pendingTask'
import { cancelTask, acceptTask } from '../api/taskApi'

import { useState } from 'react'
import { acceptTask as acceptTaskAPI } from '../api/taskApi'
import { useNavigate } from 'react-router-dom'

export const useAcceptTask = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { fetchInProcessTask } = usePendingTaskContext()
  const navigate = useNavigate()

  const acceptTask = async (taskID: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await acceptTaskAPI(taskID)
      if (res?.task) {
        await fetchInProcessTask()
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

  return {
    acceptTask,
    loading,
    error
  }
}

export const useTask = () => {
  const { refreshPendingTasks } = usePendingTaskContext()

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
    cancelCurrentTask
  }
}
