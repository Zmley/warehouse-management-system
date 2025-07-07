import apiClient from './axiosClient.ts'
import { CreateTaskPayload } from 'types/task.js'

export const getTasks = () => apiClient.get('/tasks')

export const getMyTask = () => apiClient.get('/tasks/my')

export const acceptTask = (taskID: string) =>
  apiClient.post(`/tasks/${taskID}/accept`)

export const cancelTask = (taskID: string) =>
  apiClient.post(`/tasks/${taskID}/cancel`)

export const createPickerTask = (payload: CreateTaskPayload) =>
  apiClient.post('/tasks', { payload })

export const getPickerTasks = () => apiClient.get('/tasks')

export const cancelPickerTask = (taskID: string) =>
  apiClient.post(`/tasks/${taskID}/cancel`)
