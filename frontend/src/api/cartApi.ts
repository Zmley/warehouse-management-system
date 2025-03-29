import apiClient from './axiosClient.ts'
import { InventoryItem } from '../types/inventory.js'
import { resolve } from 'path'

export const getInventoriesInCart = async (): Promise<{
  inventories: InventoryItem[]
}> => {
  const response = await apiClient.get('inventory/getInventoriesInCart')
  return response.data
}

interface ProductItem {
  inventoryID: string
  quantity: number
}

export const loadToCart = async (binCode: string) => {
  const response = await apiClient.post('cart/load', { binCode })
  return {
    success: response.data.success,
    data: response.data
  }
}

export const unloadFromCart = async (
  binCode: string,
  unloadProductList: ProductItem[]
) => {
  const response = await apiClient.post('cart/unload', {
    binCode,
    unloadProductList
  })

  return {
    success: response.data.success,
    data: response.data
  }
}
