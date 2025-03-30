// src/types/task.ts
export interface Task {
  taskID: string
  sourceBinID: string | null
  sourceBins: string[]
  sourceBinCodes: string[]
  destinationBinID: string | null
  destinationBinCode: string | null
  status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELLED'
  creatorID: string
  accepterID: string | null
  createdAt: string
  updatedAt: string
  productCode: string
}
