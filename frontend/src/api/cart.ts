import apiClient from './axiosClient.ts'
import { LoadPayload, UnloadPayload } from 'types/cart.js'

export const getInventoriesInCart = () =>
  apiClient.get('inventories/inventoriesInCart')

export const load = (payload: LoadPayload) =>
  apiClient.post('/cart/load', payload)

export const unload = (payload: UnloadPayload) =>
  apiClient.post('cart/unload', payload)
