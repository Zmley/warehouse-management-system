import apiClient from './axiosClient.ts'
import type {
  ConfirmAction,
  ConfirmItem,
  FetchTransfersParams,
  FetchTransfersResponse
} from 'types/trasnfer.js'

export const fetchTransfers = (params: FetchTransfersParams) =>
  apiClient.get<FetchTransfersResponse>('/transfers', { params })

export const updateReceiveStatus = (
  items: ConfirmItem[],
  action: ConfirmAction = 'CONFIRM'
) => apiClient.post('/transfers/receive', { action, items })

export const confirmReceive = (items: ConfirmItem[]) =>
  updateReceiveStatus(items, 'CONFIRM')

export const undoConfirmReceive = (items: ConfirmItem[]) =>
  updateReceiveStatus(items, 'UNDO_CONFIRM')
