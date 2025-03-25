// src/types/task.ts
export interface Task {
  taskID: string
  sourceBinID: string
  sourceBin: {
    binCode: string
  }
  destinationBin: {
    binCode: string
  }
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  creatorID: string
  accepterID: string
  createdAt: string
}
