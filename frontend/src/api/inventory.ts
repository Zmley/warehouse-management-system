import apiClient from './axiosClient.ts'

export const getInventoriesByBinCode = async (binCode: string) =>
  apiClient.get(`/inventories/${binCode}`)

export const getInventories = (params: {
  warehouseID: string
  keyword?: string
}) => apiClient.get('/inventories', { params })
