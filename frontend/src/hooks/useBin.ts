import { useCallback, useState } from 'react'
import {
  checkIfPickUpBin,
  getBinByBinCode,
  getBinCodes,
  getBinCodesByProductCode,
  getBinColumns,
  getEmptyBins,
  getPickupBinsByProductCode
} from 'api/bin'
import { Bin } from 'types/bin'
import { useAuth } from './useAuth'

type EmptyBin = { binID: string; binCode: string; warehouseID: string }

export const useBin = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [binCodes, setBinCodes] = useState<string[]>([])

  const [emptyBins, setEmptyBins] = useState<EmptyBin[]>([])

  const { userProfile } = useAuth()

  const warehouseID = userProfile?.warehouseID

  const [pickupBinCode, setPickupBinCode] = useState<string | null>(null)

  const [columns, setColumns] = useState<string[]>([])

  const [loading, setLoading] = useState(false)

  const fetchBinCodesByProductCode = useCallback(
    async (
      productCode: string
    ): Promise<{ binCode: string; quantity: number }[]> => {
      setIsLoading(true)
      try {
        const res = await getBinCodesByProductCode(productCode)

        if (!res.data.success || !res.data.binCodes) {
          throw new Error(res.data.message || '❌ Failed to fetch bin codes')
        }

        return res.data.binCodes
      } catch (err) {
        console.error('❌ Failed to fetch bins by product code:', err)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const fetchBinByCode = useCallback(async (binCode: string): Promise<Bin> => {
    const res = await getBinByBinCode(binCode)

    if (!res.data.success || !res.data.bin) {
      throw new Error(res.data.message || '❌ Failed to fetch bin info')
    }

    return res.data.bin
  }, [])

  const fetchBinCodes = useCallback(async () => {
    try {
      if (!warehouseID) {
        setError('❌ Warehouse ID is missing')
        return []
      }

      const res = await getBinCodes(warehouseID)

      if (!res.data.success) {
        setError(res.data.error || '❌ Failed to fetch bins')
        return []
      }

      const codes = res.data.data.map((bin: any) => bin.binCode)
      setBinCodes(codes)

      setError(null)
      return res.data.bins
    } catch (err) {
      setError('❌ Failed to fetch bins')
      return []
    }
  }, [warehouseID])

  const checkBinType = async (binCode: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await checkIfPickUpBin(binCode)
      return result.data.success === true
    } catch (err: any) {
      setError(err?.response?.data?.error || '❌ Error checking bin')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableBinCodes = useCallback(
    async (
      productCode: string
    ): Promise<{ binCode: string; quantity: number }[]> => {
      try {
        const res = await getBinCodesByProductCode(productCode)
        if (!res.data.success || !res.data.binCodes) {
          throw new Error(res.data.message || '❌ Failed to fetch bin codes')
        }
        return res.data.binCodes
      } catch (err) {
        console.error('❌ Failed to fetch bins by product code:', err)
        return []
      }
    },
    []
  )
  const getPickUpBinByProductCode = useCallback(async (productCode: string) => {
    try {
      const res = await getPickupBinsByProductCode(productCode)

      const pickupBin = res.data?.data

      if (!pickupBin || !pickupBin.binCode) {
        return {
          success: false,
          error: `❌ No ${productCode} in current warehouse!`
        }
      }

      setPickupBinCode(pickupBin.binCode)

      return {
        success: true,
        data: pickupBin.binCode
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.response?.data?.error || '❌ Failed to fetch pickup bin'
      }
    }
  }, [])

  const fetchBinColumns = useCallback(async (warehouseID?: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await getBinColumns(warehouseID)
      setColumns(res.data?.columns || [])
    } catch (err: any) {
      console.error('❌ Failed to fetch bin columns:', err)
      setError(err?.message || 'Failed to fetch bin columns')
      setColumns([])
    } finally {
      setLoading(false)
    }
  }, [])

  ////////////////
  const fetchEmptyBins = useCallback(
    async (opts?: { wid?: string; q?: string; limit?: number }) => {
      try {
        setIsLoading(true)
        setError(null)

        const res = await getEmptyBins({
          warehouseID: opts?.wid || warehouseID,
          q: opts?.q,
          limit: opts?.limit
        })

        const list: EmptyBin[] = res.data?.bins || []
        setEmptyBins(list)
        return list
      } catch (err: any) {
        console.error('❌ Failed to fetch empty bins:', err)
        setEmptyBins([])
        setError(
          err?.response?.data?.message || '❌ Failed to fetch empty bins'
        )
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [warehouseID]
  )

  return {
    fetchBinCodesByProductCode,
    fetchBinByCode,
    isLoading,
    fetchBinCodes,
    error,
    binCodes,
    checkBinType,
    fetchAvailableBinCodes,
    getPickUpBinByProductCode,
    pickupBinCode,
    columns,
    loading,
    fetchBinColumns,
    emptyBins,
    fetchEmptyBins
  }
}
