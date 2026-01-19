import { TaskStatus } from 'constants/index'

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskWithJoin = any

export type ListQuery = {
  warehouseID: string
  status?: TaskStatus
  page?: string
  limit?: string
}

export interface CreateTransferInput {
  taskID?: string | null
  sourceWarehouseID: string
  destinationWarehouseID: string
  sourceBinID?: string | null
  productCode: string
  quantity: number
  createdBy: string
  batchID?: string
}

export type DeleteArgs = {
  taskID: string
  sourceBinID?: string
  deletedBy?: string
}

export type ConfirmAction = 'CONFIRM' | 'UNDO_CONFIRM' | 'COMPLETE'
export type ConfirmItem = { transferID: string; productCode: string }

export type TransferListParams = {
  warehouseID: string
  status?: TaskStatus
  page?: number
  limit?: number
  keyword?: string
}
