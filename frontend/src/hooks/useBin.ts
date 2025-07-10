import { useCallback, useState } from 'react'
import {
  checkIfPickUpBin,
  getBinByBinCode,
  getBinCodes,
  getBinCodesByProductCode
} from 'api/bin'
import { Bin } from 'types/bin'
import { useAuth } from './useAuth'

export const useBin = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [binCodes, setBinCodes] = useState<string[]>([])

  const { userProfile } = useAuth()

  const warehouseID = userProfile?.warehouseID

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

  return {
    fetchBinCodesByProductCode,
    fetchBinByCode,
    isLoading,
    fetchBinCodes,
    error,
    binCodes,
    checkBinType
  }
}
