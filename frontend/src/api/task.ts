import apiClient from './axiosClient.ts'
import { CreateTaskPayload } from 'types/task.js'

export type GetTasksQuery = {
  page?: number
  pageSize?: number
  keyword?: string
  /** Picker list filter; omit or ALL for both pending and completed */
  listStatus?: 'PENDING' | 'COMPLETED' | 'ALL'
}

export const getTasks = (params?: GetTasksQuery) =>
  apiClient.get('/tasks', { params })

export const getMyTask = () => apiClient.get('/tasks/my')

export const acceptTask = (taskID: string) =>
  apiClient.post(`/tasks/${taskID}/accept`)

export const cancelTask = (taskID: string) =>
  apiClient.post(`/tasks/${taskID}/cancel`)

export const createPickerTask = (payload: CreateTaskPayload) =>
  apiClient.post('/tasks', { payload })

export const getPickerTasks = (params?: GetTasksQuery) =>
  apiClient.get('/tasks', { params })

export const cancelPickerTask = (taskID: string) =>
  apiClient.post(`/tasks/${taskID}/cancel`)

export const setTaskRush = (taskID: string, isRush: boolean) =>
  apiClient.patch(`/tasks/${taskID}`, { note: isRush ? 'RUSH_TASK' : null })
