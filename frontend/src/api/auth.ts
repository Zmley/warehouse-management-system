import { LoginPayload } from 'types/auth.js'
import apiClient from './axiosClient.ts'

export const loginUser = (payload: LoginPayload) =>
  apiClient.post('/account/login', payload)

export const getUserProfile = () => apiClient.get('/account/me')

export const refreshToken = (token: string) =>
  apiClient.post('/account/refresh-token', { refreshToken: token })

export const changeWarehouse = (warehouseID: string) =>
  apiClient.post('/account/changeWarehouse', { warehouseID })
