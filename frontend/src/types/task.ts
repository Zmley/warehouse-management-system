// src/types/task.ts

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
  Bin?: Bin
}

export interface Task {
  taskID: string
  sourceBinID: string | null
  sourceBins: string[] | Inventory[] // ✅ 加了兼容性处理
  sourceBinCodes?: string[] // 可选字段，仍然保留
  destinationBinID: string | null
  destinationBinCode: string | null
  destinationBin?: Bin // ✅ 如果你用到了 destinationBin.binCode
  status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELLED' | 'CANCEL'
  creatorID: string
  accepterID: string | null
  createdAt: string
  updatedAt: string
  productCode: string
  inventories?: Inventory[] // 如果任务详情页也有这个字段
}
