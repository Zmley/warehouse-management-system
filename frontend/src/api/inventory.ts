import apiClient from './axiosClient.ts'

export const getInventoriesByBinCode = async (binCode: string) =>
  apiClient.get(`/inventories/${binCode}`)
