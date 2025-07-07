import { useCallback, useState } from 'react'
import { getInventoriesByBinCode } from 'api/inventory'
import { InventoryItem } from 'types/inventory'

export const useInventory = () => {
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInventoriesByBinCode = useCallback(async (binCode: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getInventoriesByBinCode(binCode)

      if (response && Array.isArray(response.data.inventories)) {
        setInventories(response.data.inventories)
        return { success: true, inventories: response.data.inventories }
      } else {
        const message = response?.data.message || '❌ Invalid inventory data.'
        setError(message)
        return { success: false, message }
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        '❌ Failed to fetch inventories by binCode.'
      setError(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    inventories,
    isLoading,
    error,
    fetchInventoriesByBinCode
  }
}
