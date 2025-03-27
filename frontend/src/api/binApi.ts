import apiClient from './axiosClient.ts'
import { Bin } from '../types/bin'

export const getBinByBinCode = async (binCode: string): Promise<Bin> => {
  const response = await apiClient.post('/bin/getBin', { binCode })
  return response.data.bin
}
