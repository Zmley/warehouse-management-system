import apiClient from './axiosClient.ts'
import { Bin } from '../types/bin.js'

export const getBinByBinCode = async (binCode: string): Promise<Bin> => {
  const response = await apiClient.post('/bin/', { binCode })
  return response.data.bin
}

export const fetchMatchingBinCodes = async (
  productCode: string
): Promise<string[]> => {
  const response = await apiClient.post('/bin/code', {
    productCode
  })
  return response.data.binCodes
}
