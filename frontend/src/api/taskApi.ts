import apiClient from './axiosClient.ts'
import { Task, CreateTaskPayload } from 'types/task.js'

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

export const createPickerTask = async (payload: CreateTaskPayload) => {
  const response = await apiClient.post('/tasks', {
    payload
  })
  return response.data
}

export const getPickerTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get('/tasks')
  return response.data.tasks
}

export const cancelPickerTask = async (taskID: string): Promise<Task> => {
  const response = await apiClient.post(`/tasks/${taskID}/cancel`)
  return response.data.task
}

export const releaseTask = async (taskID: string) => {
  const res = await apiClient.patch(`/tasks/${taskID}/release`)
  return res.data
}
