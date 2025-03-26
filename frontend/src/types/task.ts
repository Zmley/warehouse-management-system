// src/types/task.ts
export interface Task {
  taskID: string
  sourceBinID: string | null // sourceBinID 可能为空
  sourceBinCode: string[] // 改为 sourceBinCode 数组
  destinationBinID: string | null // destinationBinID 可能为空
  destinationBinCode: string[] // 改为 destinationBinCode 数组
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  creatorID: string
  accepterID: string | null // accepterID 可能为空
  createdAt: string
  productCode: string
}
