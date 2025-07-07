import apiClient from './axiosClient.ts'

export const getProductCodes = () => apiClient.get('/products/codes')

export const getProductByBarCode = (barCode: string) =>
  apiClient.get(`/products/by-barCode?barCode=${barCode}`)
