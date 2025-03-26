import apiClient from './axiosClient.ts'
import { InventoryItem } from '../types/inventory.js'

export const getInventoriesByCart = async (): Promise<{
  hasProductInCar: boolean
  inventories: InventoryItem[]
}> => {
  const response = await apiClient.get('inventory/getInventoriesByCart')
  return response.data
}

interface ProductItem {
  inventoryID: string
  quantity: number
}

export const loadToCart = async (binCode: string) => {
  const payload = { binCode, action: 'load' }
  const response = await apiClient.post('cart/load', payload)

  return {
    success: true,
    data: response.data
  }
}

export const unloadFromCart = async (
  binCode: string,
  unloadProductList: ProductItem[]
) => {
  const payload = { binCode, unloadProductList }
  const response = await apiClient.post('cart/unload', payload)

  return {
    success: true,
    data: response.data
  }
}

export const getMyCartCode = async (): Promise<{
  sourceBinCode: string
  destinationBinCode: string
}> => {
  const response = await apiClient.post('/cart/carCode')
  return response.data
}
