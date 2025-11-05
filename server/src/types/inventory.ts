export interface InventoryUploadType {
  binID?: string | null
  binCode: string
  productCode: string
  quantity: number
}

export type FlatInventoryRow = {
  binCode: string
  productCode: string
  quantity: number
}

export type UnloadRow = {
  inventoryID: string
  quantity: number
  merge?: boolean
}

export interface InventoryByBinIDUpload {
  binID: string
  productCode: string
  quantity: number
}

export interface InventoryDTO {
  inventoryID: string | null
  binID: string
  productCode: string | null
  quantity: number | null
  createdAt: Date | null
  updatedAt: Date | null
  bin: {
    binCode: string
    binID: string
  }
}
