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

export interface TransferListParams {
  warehouseID: string
  status?: TaskStatus
  keyword?: string
  page?: number
  pageSize?: number
  sortField?: 'updatedAt' | 'createdAt'
  sortOrder?: 'ASC' | 'DESC'
}

export interface TransferListParams {
  warehouseID: string
  status?: TaskStatus
  page?: number
}
