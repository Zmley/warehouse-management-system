import { TaskCategoryEnum } from 'constants/index'

export type TransferStatus = TaskCategoryEnum

export interface FetchTransfersParams {
  warehouseID: string
  status?: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELED'
  page?: number
  limit?: number
}

export interface FetchTransfersResponse {
  success: boolean
  transfers: any[]
  total: number
  page: number
  message?: string
}

export interface DeleteTransferResponse {
  success: boolean
  transferID: string
  message?: string
}
export interface ConfirmItem {
  transferID: string
  productCode: string
  productID?: string | null
  quantity: number
}

export type ConfirmAction = 'CONFIRM' | 'UNDO_CONFIRM'
