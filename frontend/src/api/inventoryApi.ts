import apiClient from './axiosClient.ts'

export const getInventoriesByBinCode = async (binCode: string) => {
  const res = await apiClient.get(`/inventories/${binCode}`)
  return res.data
}
