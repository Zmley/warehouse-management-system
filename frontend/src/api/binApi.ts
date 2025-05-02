import apiClient from './axiosClient.ts'
import { Bin } from 'types/bin.js'

export const getBinByBinCode = async (binCode: string): Promise<Bin> => {
  const response = await apiClient.get(`/bins/${binCode}`)
  return response.data.bin
}

export const getBinCodesByProductCode = async (
  productCode: string
): Promise<{ binCode: string; quantity: number }[]> => {
  const response = await apiClient.get(`/bins/code/${productCode}`)
  return response.data.binCodes
}
