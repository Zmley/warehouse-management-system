export interface Bin {
  binID: string
  binCode: string
}

export interface Inventory {
  inventoryID: string
  binID: string
  productCode: string
  quantity: number
  createdAt: string
  updatedAt: string
  Bin: Bin
}

export interface PickerTask {
  taskID: string
  sourceBinID: string | null
  destinationBinID: string
  creatorID: string
  accepterID: string | null
  productCode: string
  status: 'PENDING' | 'COMPLETED' | 'CANCEL'
  createdAt: string
  updatedAt: string
  destinationBin: Bin
  inventories: Inventory[]
  sourceBins: Inventory[]
  destinationBinCode: string
}
