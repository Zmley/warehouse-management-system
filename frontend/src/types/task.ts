export interface Bin {
  binID: string
  binCode: string
}

export enum TaskCategoryEnum {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}
export interface Inventory {
  inventoryID: string
  binID: string
  productCode: string
  quantity: number
  createdAt: string
  updatedAt: string
  bin: {
    binID: string
    binCode: string
  }
}

export interface Task {
  taskID: string
  sourceBinID: string | null
  sourceBins: string[] | Inventory[]
  sourceBinCodes?: string[]
  destinationBinID: string | null
  destinationBinCode: string | null
  destinationBin?: Bin
  status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELLED'
  creatorID: string
  accepterID: string | null
  createdAt: string
  updatedAt: string
  productCode: string
  inventories?: Inventory[]
  quantity: number
}
