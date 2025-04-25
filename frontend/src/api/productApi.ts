import apiClient from './axiosClient.ts'

export const getProductCodes = async (): Promise<{
  productCodes: string[]
}> => {
  const response = await apiClient.get('/products/codes')
  return response.data
}
