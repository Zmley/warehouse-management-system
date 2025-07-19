import axios from 'axios'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens
} from 'utils/Storages'

const API_BASE_URL = `${
  process.env.REACT_APP_SERVER_API_BASE_URL || 'http://localhost:5001'
}/api`

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.request.use(config => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理 401 并尝试使用 refreshToken
apiClient.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config

    // Token 过期且尚未重试
    if (
      (err.response?.status === 401 || err.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearTokens()
        window.location.href = '/'
        return Promise.reject(err)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch(error => Promise.reject(error))
      }

      isRefreshing = true

      try {
        const response = await axios.post(`${API_BASE_URL}/refresh-token`, {
          refreshToken
        })

        const { accessToken, idToken } = response.data
        saveTokens({ accessToken, idToken, refreshToken })
        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`

        processQueue(null, accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        window.location.href = '/'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default apiClient
