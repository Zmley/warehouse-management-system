import axios from 'axios'
import { clearTokens, getAccessToken } from '../utils/Storages'

const API_BASE_URL = `${
  process.env.SERVER_API_BASE_URL || 'http://localhost:5001'
}/api`

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      clearTokens()
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

apiClient.interceptors.request.use(config => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
