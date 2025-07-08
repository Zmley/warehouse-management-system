import apiClient from './axiosClient.ts'

export const getInventoriesByBinCode = async (binCode: string) =>
  apiClient.get(`/inventories/${binCode}`)

export const getInventories = async (params: {
  warehouseID: string
  binID?: string
  page?: number
  limit?: number
  keyword?: string
}) => {
  const response = await apiClient.get('/inventories', { params })

  return {
    inventory: response.data.inventories,
    totalCount: response.data.totalCount
  }
}
