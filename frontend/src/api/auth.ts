import apiClient from './axiosClient.ts'

export const loginUser = (email: string, password: string) =>
  apiClient.post('/login', { email, password })

export const getUserProfile = () => apiClient.get('/me')
