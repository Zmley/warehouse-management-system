import apiClient from './axiosClient.ts'
import { InventoryItem } from 'types/inventory'
import { unloadInventory } from 'types/inventory'

export const getInventoriesInCart = async (): Promise<{
  inventories: InventoryItem[]
}> => {
  const response = await apiClient.get('inventories/inventoriesInCart')
  return response.data
}

type LoadParams =
  | { binCode: string }
  | { productCode: string; quantity: number }

export const load = async (params: LoadParams) => {
  const response = await apiClient.post('/cart/load', params)

  return {
    success: response.data.success,
    data: response.data
  }
}

export const unload = async (
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
