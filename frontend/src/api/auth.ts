import { LoginPayload } from 'types/auth.js'
import apiClient from './axiosClient.ts'

export const loginUser = (payload: LoginPayload) =>
  apiClient.post('/login', payload)

export const getUserProfile = () => apiClient.get('/me')
