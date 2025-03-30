import apiClient from './axiosClient.ts'
import { Task } from '../types/task.js'

export const getTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get('/task/tasks')
  return response.data.tasks
}

export const getMyTask = async (): Promise<Task> => {
  const response = await apiClient.get('/task/my')
  return response.data.task
}

export const acceptTask = async (taskID: string) => {
  const response = await apiClient.post(`/task/${taskID}/accept`)
  return response.data
}

export const cancelTask = async (taskID: string) => {
  const response = await apiClient.post(`/task/${taskID}/cancel`)
  return response.data
}
