import { useState, useCallback, useRef } from 'react'
import { useTaskContext } from 'contexts/task'
import {
  acceptTask as acceptTaskAPI,
  cancelTask as cancelTaskAPI,
  getTasks
} from 'api/task'
import { Task } from 'types/task'

const PAGE_SIZE = 30

export const useTask = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { fetchMyTask } = useTaskContext()
  const [tasks, setTasks] = useState<Task[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  /** Committed server-side search (API keyword); ref avoids stale closures in loadMore */
  const keywordRef = useRef('')

  const loadFirstPage = useCallback(async () => {
    const kw = keywordRef.current.trim()
    setIsLoading(true)
    try {
      const result = await getTasks({
        page: 1,
        pageSize: PAGE_SIZE,
        keyword: kw || undefined
      })
      const firstBatch = result.data.tasks || []
      setTasks(firstBatch)
      setPage(1)
      setHasMore(Boolean(result.data.hasMore) && firstBatch.length >= PAGE_SIZE)
    } catch (err) {
      console.error('❌ Error loading tasks', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    await loadFirstPage()
  }, [loadFirstPage])

  const commitSearchKeyword = useCallback(
    async (raw: string) => {
      keywordRef.current = raw.trim()
      await loadFirstPage()
    },
    [loadFirstPage]
  )

  const clearSearchKeyword = useCallback(async () => {
    keywordRef.current = ''
    await loadFirstPage()
  }, [loadFirstPage])

  const loadMoreTasks = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return
    setIsLoadingMore(true)
    try {
      const next = page + 1
      const kw = keywordRef.current.trim()
      const result = await getTasks({
        page: next,
        pageSize: PAGE_SIZE,
        keyword: kw || undefined
      })
      const batch = result.data.tasks || []
      setTasks(prev => [...prev, ...batch])
      setPage(next)
      setHasMore(
        Boolean(result.data.hasMore) && batch.length > 0 && batch.length >= PAGE_SIZE
      )
    } catch (err) {
      console.error('❌ Error loading more tasks', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, isLoading, page])

  const acceptTask = async (taskID: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await acceptTaskAPI(taskID)

      if (res?.data.success && res?.data.task) {
        return true
      } else {
        setError(res?.data.errorCode || 'UNKNOWN_ERROR')
        return false
      }
    } catch (err: any) {
      const code = err?.response?.data?.errorCode || 'UNKNOWN_ERROR'
      setError(code)
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

  return {
    acceptTask,
    cancelMyTask,
    isLoading,
    isLoadingMore,
    error,
    tasks,
    fetchTasks,
    loadMoreTasks,
    commitSearchKeyword,
    clearSearchKeyword,
    hasMore,
    fetchMyTask,
    setError
  }
}
