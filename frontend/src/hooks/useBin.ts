import { useCallback, useState } from 'react'
import { getBinByBinCode, getBinCodesByProductCode } from 'api/binApi'
import { Bin } from 'types/bin'

export const useBin = () => {
  const [isLoading, setIsLoading] = useState(false)

  const fetchBinCodes = useCallback(
    async (
      productCode: string
    ): Promise<{ binCode: string; quantity: number }[]> => {
      setIsLoading(true)
      try {
        return await getBinCodesByProductCode(productCode)
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

  return { fetchBinCodes, fetchBinByCode, isLoading }
}
