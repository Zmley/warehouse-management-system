import apiClient from './axiosClient.ts'
import { InventoryItem } from '../types/inventory.js'
import { unloadInventory } from '../types/unloadInventory.js'

export const getInventoriesInCart = async (): Promise<{
  inventories: InventoryItem[]
}> => {
  const response = await apiClient.get('inventory/getInventoriesInCart')
  return response.data
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
  unloadProductList: unloadInventory[]
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
