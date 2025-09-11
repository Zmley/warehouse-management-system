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

//////////////////////

export interface InventoryUploadType {
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
