export interface InProcessTask {
  taskID: string
  sourceBinID: string | null
  destinationBinID: string | null
  status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELLED'
  creatorID: string
  accepterID: string | null
  createdAt: string
  productCode: string
}
