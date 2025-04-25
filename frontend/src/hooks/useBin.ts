import { useCallback } from 'react'
import { getBinCodesByProductCode } from 'api/binApi'

export const useBin = () => {
  const fetchBinCodes = useCallback(
    async (productCode: string): Promise<string[]> => {
      return await getBinCodesByProductCode(productCode)
    },
    []
  )

  return { fetchBinCodes }
}
