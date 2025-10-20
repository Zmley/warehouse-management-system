import apiClient from './axiosClient.ts'
import type {
  ConfirmAction,
  ConfirmItem,
  CreateTransferPayload,
  FetchTransfersParams,
  FetchTransfersResponse
} from 'types/trasnfer.js'

export const createTransfer = (payload: CreateTransferPayload) =>
  apiClient.post('/transfers', payload)

export const fetchTransfers = (params: FetchTransfersParams) =>
  apiClient.get<FetchTransfersResponse>('/transfers', { params })

export const cancelTransfer = (transferID: string) =>
  apiClient.post(`/transfers/${encodeURIComponent(transferID)}/cancel`)

export const deleteTransfersByTaskID = (taskID: string, sourceBinID?: string) =>
  apiClient.delete(`/transfers/${encodeURIComponent(taskID)}`, {
    params: sourceBinID ? { sourceBinID } : undefined
  })

export const updateReceiveStatus = (
  items: ConfirmItem[],
  action: ConfirmAction = 'CONFIRM'
) => apiClient.post('/transfers/receive', { action, items })

export const confirmReceive = (items: ConfirmItem[]) =>
  updateReceiveStatus(items, 'CONFIRM')

export const undoConfirmReceive = (items: ConfirmItem[]) =>
  updateReceiveStatus(items, 'UNDO_CONFIRM')
