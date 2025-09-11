import {
  GetInventoriesParams,
  InventoryUpdate,
  InventoryUploadType
} from 'types/inventory.js'
import apiClient from './axiosClient.ts'

export const getInventoriesByBinCode = async (binCode: string) =>
  apiClient.get(`/inventories/${binCode}`)

// export const getInventories = (params: {
//   warehouseID: string
//   keyword?: string
// }) => apiClient.get('/inventories', { params })

export const getInventories = async (params: GetInventoriesParams) =>
  apiClient.get('/inventories', { params })

// export const getInventories = async (params: GetInventoriesParams) =>
//   apiClient.get('/inventories', { params })

export const deleteInventory = async (inventoryID: string) =>
  apiClient.delete(`/inventories/${inventoryID}`)

export const bulkUpdateInventory = (updates: InventoryUpdate[]) =>
  apiClient.put('/inventories', { updates })

export const addInventories = (inventories: InventoryUploadType[]) =>
  apiClient.post('/inventories', inventories)
