import { useState, useCallback } from 'react'
import {
  cancelTransfer,
  createTransfer as createTransferAPI,
  fetchTransfers,
  deleteTransfersByTaskID,
  confirmReceive,
  undoConfirmReceive
} from 'api/transfer'
import {
  ConfirmItem,
  CreateTransferPayload,
  FetchTransfersParams,
  FetchTransfersResponse
} from 'types/trasnfer'

const pickErrMsg = (e: any, fallback: string) =>
  e?.response?.data?.message || e?.message || fallback

export const useTransfer = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [transfers, setTransfers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const createTransferTask = useCallback(
    async (payload: CreateTransferPayload) => {
      try {
        setIsLoading(true)
        setError(null)

        const body: CreateTransferPayload = {
          ...payload,
          taskID: payload.taskID ?? null
        }

        const res = await createTransferAPI(body)
        const data = res.data as { success?: boolean; message?: string }
        if (!data?.success) {
          const msg = data?.message || 'Create transfer failed'
          setError(msg)
          return { success: false, message: msg }
        }
        return data
      } catch (e: any) {
        const msg = pickErrMsg(e, 'Create transfer failed')
        setError(msg)
        return { success: false, message: msg }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const getTransfers = useCallback(
    async (params: FetchTransfersParams): Promise<FetchTransfersResponse> => {
      try {
        setIsLoading(true)
        setError(null)

        const res = await fetchTransfers(params)
        const data = res.data as FetchTransfersResponse

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch transfers')
        }

        setTransfers(data.transfers || [])
        setTotal(data.total ?? 0)
        setPage(data.page ?? params.page ?? 1)

        return data
      } catch (e: any) {
        const msg = pickErrMsg(e, 'Failed to fetch transfers')
        setError(msg)
        return {
          success: false,
          transfers: [],
          total: 0,
          page: params.page ?? 1,
          message: msg
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const cancel = useCallback(async (transferID: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await cancelTransfer(transferID)
      const data = res.data as { success?: boolean; message?: string }
      if (data?.success === false) {
        const msg = data.message || 'Cancel failed'
        setError(msg)
        return { success: false, message: msg }
      }
      return { success: true }
    } catch (err: any) {
      const msg = pickErrMsg(err, 'Cancel failed')
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const removeByTaskID = useCallback(
    async (taskID: string, sourceBinID?: string) => {
      try {
        setLoading(true)
        setError(null)
        const res = await deleteTransfersByTaskID(taskID, sourceBinID)
        const data = res.data as { success?: boolean; message?: string }
        if (data?.success === false) {
          const msg = data.message || 'Delete failed'
          setError(msg)
          return { success: false, message: msg }
        }
        return { success: true }
      } catch (err: any) {
        const msg = pickErrMsg(err, 'Delete failed')
        setError(msg)
        return { success: false, message: msg }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const handleConfirmReceive = useCallback(async (items: ConfirmItem[]) => {
    setLoading(true)
    try {
      const res = await confirmReceive(items)
      return res.data
    } catch (err: any) {
      const msg = pickErrMsg(err, 'Confirm receive failed')
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleUndoConfirmReceive = useCallback(async (items: ConfirmItem[]) => {
    setLoading(true)
    try {
      const res = await undoConfirmReceive(items)
      return res.data
    } catch (err: any) {
      const msg = pickErrMsg(err, 'Undo confirm failed')
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    transfers,
    total,
    page,
    pageSize,
    isLoading,
    loading,
    error,
    getTransfers,
    createTransferTask,
    cancel,
    removeByTaskID,
    handleConfirmReceive,
    handleUndoConfirmReceive,
    setPage,
    setPageSize
  }
}
