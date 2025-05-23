import { useCallback, useState } from 'react'
import {
  checkIfPickUpBin,
  getBinByBinCode,
  getBinCodes,
  getBinCodesByProductCode
} from 'api/binApi'
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
        return await getBinCodesByProductCode(productCode)
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

    if (!res.success || !res.bin) {
      throw new Error(res.error || '❌ Failed to fetch bin info')
    }

    return res.bin
  }, [])

  const fetchBinCodes = useCallback(async () => {
    try {
      if (!warehouseID) {
        setError('❌ Warehouse ID is missing')
        return []
      }

      const res = await getBinCodes(warehouseID)

      if (!res.success) {
        setError(res.error || '❌ Failed to fetch bins')
        return []
      }

      const codes = res.data.map((bin: any) => bin.binCode)
      setBinCodes(codes)

      setError(null)
      return res.bins
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
      return result.success === true
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
