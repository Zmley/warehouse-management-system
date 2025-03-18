import apiClient from './axiosClient.ts'

export const loginUser = async (email: string, password: string) => {
  const response = await apiClient.post('/api/login', { email, password })
  return response.data
}

export const fetchUserProfile = async () => {
  const response = await apiClient.get('/api/me')
  return response.data || null
}
