import { useCallback, useContext, useState } from 'react'
import { getInventories, getInventoriesByBinCode } from 'api/inventory'
import { InventoryItem } from 'types/inventory'
import { AuthContext } from 'contexts/auth'

export const useInventory = () => {
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { userProfile } = useContext(AuthContext)!

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

  const { warehouseID } = userProfile

  const fetchInventories = useCallback(
    async (keyword?: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const { data } = await getInventories({
          warehouseID: warehouseID,
          keyword
        })

        setInventories(data.inventories)
        return { success: true }
      } catch (err: any) {
        const message =
          err?.response?.data?.message || '❌ Failed to fetch inventories.'
        setError(message)
        return { success: false, message }
      } finally {
        setIsLoading(false)
      }
    },
    [warehouseID]
  )

  return {
    inventories,
    isLoading,
    error,
    fetchInventoriesByBinCode,
    fetchInventories
  }
}
