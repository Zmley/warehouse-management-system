// src/types/task.ts
export interface Task {
  taskID: string
  sourceBinID: string | null
  sourceBinCode: string[]
  destinationBinID: string | null
  destinationBinCode: string[]
  status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELLED'
  creatorID: string
  accepterID: string | null
  createdAt: string
  updatedAt: string
  productCode: string
}
