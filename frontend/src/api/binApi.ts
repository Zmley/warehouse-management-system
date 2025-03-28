import apiClient from './axiosClient.ts'
import { Bin } from '../types/bin'

export const getBinByBinCode = async (binCode: string): Promise<Bin> => {
  const response = await apiClient.post('/bin/getBin', { binCode })
  return response.data.bin
}

export const fetchMatchingBinCodes = async (
  productCode: string
): Promise<string[]> => {
  const response = await apiClient.post('/bin/matchBinCode', {
    productCode
  })
  return response.data.binCodes
}
