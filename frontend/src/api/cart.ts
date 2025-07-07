import apiClient from './axiosClient.ts'
import { unloadInventory } from 'types/inventory'

export interface UnloadPayload {
  binCode: string
  unloadProductList: unloadInventory[]
}

export const getInventoriesInCart = () =>
  apiClient.get('inventories/inventoriesInCart')

type LoadParams =
  | { binCode: string }
  | { productCode: string; quantity: number }

export const load = (params: LoadParams) => apiClient.post('/cart/load', params)

export const unload = (binCode: string, unloadProductList: unloadInventory[]) =>
  apiClient.post('cart/unload', {
    binCode,
    unloadProductList
  })
