import apiClient from './axiosClient.ts'
import { Task } from '../types/task.js'

export const getTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get('/tasks')
  return response.data.tasks
}

export const getMyTask = async (): Promise<Task> => {
  const response = await apiClient.get('/tasks/my')
  return response.data.task
}

export const acceptTask = async (taskID: string) => {
  const response = await apiClient.post(`/tasks/${taskID}/accept`)
  return response.data
}

export const cancelTask = async (taskID: string) => {
  const response = await apiClient.post(`/tasks/${taskID}/cancel`)
  return response.data
}

export const createPickerTask = async (
  binCode: string,
  productCode: string
): Promise<Task> => {
  const response = await apiClient.post('/tasks', {
    binCode,
    productCode
  })
  return response.data.task
}

export const getPickerTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get('/tasks/picker')
  return response.data.tasks
}

export const cancelPickerTask = async (taskID: string): Promise<Task> => {
  const response = await apiClient.post(`/tasks/${taskID}/cancelPicker`)
  return response.data.task
}
