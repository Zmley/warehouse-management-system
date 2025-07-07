import apiClient from './axiosClient.ts'

export const getBinByBinCode = (binCode: string) =>
  apiClient.get(`/bins/${binCode}`)

export const getBinCodesByProductCode = (productCode: string) =>
  apiClient.get(`/bins/code/${productCode}`)

export const getBinCodes = (warehouseID: string) =>
  apiClient.get(`/bins/codes?warehouseID=${warehouseID}`)

export const checkIfPickUpBin = (binCode: string) =>
  apiClient.get(`/bins/check-pickup/${binCode}`)
