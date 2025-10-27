import { TransferStatusUI } from 'constants/index'

export interface InventoryItem {
  bin: {
    binCode: string
    binID: string
  }
  inventoryID: string
  binID: string
  productCode: string
  quantity: number
}

export interface unloadInventory {
  inventoryID: string
  quantity: number
  merge?: boolean
}

export interface InventoryUploadType {
  binID?: string | null
  binCode: string
  productCode: string
  quantity: number
}

export interface InventoryUpdate {
  inventoryID: string
  quantity?: number
  productCode?: string
  binID?: string
}

export interface GetInventoriesParams {
  warehouseID: string
  binID?: string
  page?: number
  limit?: number
  keyword?: string
  sortBy?: 'updatedAt' | 'binCode'
  sort?: 'asc' | 'desc'
}

export type DrawerLine = {
  productCode: string
  qty: number
}

export type DrawerMode = 'CONFIRM' | 'UNDO'

export type TransferRow = {
  transferID: string
  productCode: string
  quantity: number
  status: TransferStatusUI
  taskID?: string | null
  sourceBinID?: string | null
  sourceBinCode?: string | null
  sourceWarehouseCode?: string | null
  batchID?: string | null
}

export type PalletGroup = {
  binCode: string | null
  warehouseCode: string | null
  rows: TransferRow[]
}

export type PendingLite = {
  transferID: string
  productCode: string
  quantity: number
}
export type ConfirmItem = {
  transferID: string
  productCode: string
  quantity: number
}
export type UndoItem = { transferID: string; productCode: string }
