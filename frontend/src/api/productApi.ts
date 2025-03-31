import apiClient from './axiosClient.ts'

export const fetchAllProducts = async (): Promise<{
  productCodes: string[]
}> => {
  const response = await apiClient.get('/products/')
  return response.data
}
