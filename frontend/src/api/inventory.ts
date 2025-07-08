import apiClient from './axiosClient.ts'

export const getInventoriesByBinCode = async (binCode: string) =>
  apiClient.get(`/inventories/${binCode}`)

export const getInventories = (params: {
  warehouseID: string
  binID?: string
  page?: number
  limit?: number
  keyword?: string
}) => apiClient.get('/inventories', { params })
