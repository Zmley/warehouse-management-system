import apiClient from './axiosClient.ts'

export const getBinByBinCode = async (binCode: string) => {
  const response = await apiClient.get(`/bins/${binCode}`)
  return response.data
}

export const getBinCodesByProductCode = async (
  productCode: string
): Promise<{ binCode: string; quantity: number }[]> => {
  const response = await apiClient.get(`/bins/code/${productCode}`)
  return response.data.binCodes
}
