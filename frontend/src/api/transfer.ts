import {
  ConfirmAction,
  ConfirmItem,
  CreateTransferPayload,
  FetchTransfersParams,
  FetchTransfersResponse
} from 'types/trasnfer.js'
import apiClient from './axiosClient.ts'

export const createTransfer = async (payload: CreateTransferPayload) => {
  const res = await apiClient.post('/transfers', payload)
  return res.data
}

export async function fetchTransfers(params: FetchTransfersParams) {
  const res = await apiClient.get('/transfers', { params })
  return res.data as FetchTransfersResponse
}

export const cancelTransfer = (transferID: string) =>
  apiClient.post(`/transfers/${transferID}/cancel`)

export const deleteTransfersByTaskID = (taskID: string, sourceBinID?: string) =>
  apiClient.delete(
    `/transfers/${encodeURIComponent(taskID)}`,
    sourceBinID ? { params: { sourceBinID } } : undefined
  )

export const updateReceiveStatus = async (
  items: ConfirmItem[],
  action: ConfirmAction = 'CONFIRM'
) => {
  const res = await apiClient.post('/transfers/receive', { action, items })
  return res.data
}

export const confirmReceive = (items: ConfirmItem[]) =>
  updateReceiveStatus(items, 'CONFIRM')

export const undoConfirmReceive = (items: ConfirmItem[]) =>
  updateReceiveStatus(items, 'UNDO_CONFIRM')
