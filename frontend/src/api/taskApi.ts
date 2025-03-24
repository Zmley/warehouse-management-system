// src/api/taskApi.ts
import apiClient from './axiosClient.ts'
import { Task } from '../types/task.js'

export const getPendingTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get('/task/pending')
  return response.data.tasks
}
