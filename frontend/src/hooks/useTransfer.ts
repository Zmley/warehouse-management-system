import { useState, useCallback } from 'react'
import {
  fetchTransfers,
  confirmReceive,
  undoConfirmReceive
} from 'api/transfer'
import {
  ConfirmItem,
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
    handleConfirmReceive,
    handleUndoConfirmReceive,
    setPage,
    setPageSize
  }
}
