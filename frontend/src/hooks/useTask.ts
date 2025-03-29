import { usePendingTaskContext } from '../contexts/pendingTask'
import { cancelTask, acceptTask } from '../api/taskApi'

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
