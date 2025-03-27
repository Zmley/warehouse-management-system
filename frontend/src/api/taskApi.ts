// src/api/taskApi.ts
import apiClient from './axiosClient.ts'
import { Task } from '../types/task.js'

export const getPendingTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get('/task/pending')
  return response.data.tasks
}

export const acceptTask = async (taskID: string) => {
  const response = await apiClient.post('/task/acceptTask', { taskID })
  return response.data
}

export const getCurrentInProcessTask = async (): Promise<Task> => {
  const response = await apiClient.get('/task/inprocessTask')
  return response.data.task
}

export const cancelTask = async (taskID: string) => {
  const response = await apiClient.post('/task/cancelTask', { taskID })
  return response.data
}
