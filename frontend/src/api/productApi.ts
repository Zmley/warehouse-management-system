import apiClient from './axiosClient.ts'

export const getProductCodes = async (): Promise<{
  productCodes: string[]
}> => {
  const response = await apiClient.get('/products/codes')
  return response.data
}

export const getProductByBarCode = async (barCode: string) => {
  const res = await apiClient.get('/products/product', {
    params: { barCode }
  })
  return res.data
}
