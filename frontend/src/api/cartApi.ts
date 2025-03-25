import apiClient from './axiosClient.ts'
import { InventoryItem } from '../types/inventory.js'

export const checkHasProductInCar = async (): Promise<{
  hasProductInCar: boolean
  inventories: InventoryItem[]
}> => {
  const response = await apiClient.get('cart/hasProductInCar')
  return response.data
}

interface ProductItem {
  inventoryID: string
  quantity: number
}

export const loadToCart = async (binID: string) => {
  const payload = { binID, action: 'load' }
  const response = await apiClient.post('cart/load', payload)

  return {
    success: true,
    data: response.data
  }
}

export const unloadFromCart = async (
  binID: string,
  unloadProductList: ProductItem[]
) => {
  const payload = { binID, unloadProductList }
  const response = await apiClient.post('cart/unload', payload)

  return {
    success: true,
    data: response.data
  }
}
