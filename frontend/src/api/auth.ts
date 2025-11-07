import { LoginPayload } from 'types/auth.js'
import apiClient from './axiosClient.ts'

export const loginUser = (payload: LoginPayload) =>
  apiClient.post('/login', payload)

export const getUserProfile = () => apiClient.get('/me')

export const refreshToken = (token: string) =>
  apiClient.post('/refresh-token', { refreshToken: token })

export const changeWarehouse = (warehouseID: string) =>
  apiClient.post('/changeWarehouse', { warehouseID })
