// src/api/productApi.ts

import apiClient from './axiosClient.ts'

export const fetchAllProducts = async (): Promise<{
  productCodes: string[]
}> => {
  const response = await apiClient.get('/product/')
  return response.data
}
