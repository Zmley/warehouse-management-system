import { useState } from 'react'
import {
  createPickerTask,
  getPickerTasks,
  cancelPickerTask,
  setTaskRush
} from 'api/task'
import { CreateTaskPayload, Task } from 'types/task'
import { useAuth } from 'hooks/useAuth'

const isRushNote = (note: string | null | undefined) =>
  note === 'RUSH_TASK' || note === 'URGENT' || note === '加急'

const sortPickerTasks = (items: Task[]) => {
  return [...items].sort((a, b) => {
    const ar = isRushNote(a.note) ? 0 : 1
    const br = isRushNote(b.note) ? 0 : 1
    if (ar !== br) return ar - br

    const at = new Date(a.updatedAt).getTime()
    const bt = new Date(b.updatedAt).getTime()
    return bt - at
  })
}

export const usePickerTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { userProfile } = useAuth()

  const fetchTasks = async (): Promise<Task[]> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getPickerTasks()
      const sorted = sortPickerTasks(res.data.tasks || [])
      setTasks(sorted)
      return sorted
    } catch (err) {
      setError('Failed to fetch tasks')
      return []
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
  ): Promise<{ task: CreateTaskPayload | null; errorCode?: string }> => {
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

      return { task: result.data.task as CreateTaskPayload }
    } catch (err: any) {
      const code =
        err?.response?.data?.errorCode || err?.code || 'UNKNOWN_ERROR'
      setError(code)
      return { task: null, errorCode: code }
    } finally {
      setIsLoading(false)
    }
  }

  const setRush = async (taskID: string, isRush: boolean): Promise<boolean> => {
    const prevTasks = tasks

    const nextNote: string | null = isRush ? 'RUSH_TASK' : null
    const optimisticNow = new Date().toISOString()

    setError(null)
    setTasks(prev =>
      sortPickerTasks(
        prev.map(t =>
          t.taskID === taskID
            ? { ...t, note: nextNote, updatedAt: optimisticNow }
            : t
        )
      )
    )

    try {
      const res = await setTaskRush(taskID, isRush)
      const serverTask = res?.data?.task as Task | undefined
      if (serverTask?.taskID) {
        setTasks(prev =>
          sortPickerTasks(
            prev.map(t => (t.taskID === serverTask.taskID ? { ...t, ...serverTask } : t))
          )
        )
      }
      return true
    } catch (err: any) {
      const code = err?.response?.data?.errorCode || 'UNKNOWN_ERROR'
      setError(code)
      setTasks(sortPickerTasks(prevTasks))
      return false
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
    createPickTask,
    setRush
  }
}
