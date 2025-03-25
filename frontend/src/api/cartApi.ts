// src/api/cartApi.ts
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

export const processCart = async (
  binID: string,
  isLoadingToCar: boolean,
  unloadProductList?: ProductItem[]
) => {
  try {
    const endpoint = isLoadingToCar ? 'cart/load' : 'cart/unload'

    const payload = isLoadingToCar
      ? { binID, action: 'load' }
      : { binID, unloadProductList }

    console.log(`📡 Calling ${endpoint} with payload:`, payload)

    const response = await apiClient.post(endpoint, payload)

    return {
      success: true,
      data: response.data
    }
  } catch (error: any) {
    console.error(
      '❌ Error in processBinTask:',
      error.response?.data || error.message
    )

    return {
      success: false,
      error: error.response?.data || error.message
    }
  }
}
