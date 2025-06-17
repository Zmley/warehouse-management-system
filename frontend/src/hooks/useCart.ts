import { useState } from 'react'
import { useCartContext } from 'contexts/cart'
import { load, unload } from 'api/cartApi'
import { useNavigate } from 'react-router-dom'
import { InventoryItem } from 'types/inventory'
import { unloadInventory } from 'types/unloadInventory'

export const useCart = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    getMyCart,
    isCartEmpty,
    setInventoriesInCar,
    inventoriesInCar,
    sourceBin,
    setSourceBin
  } = useCartContext()

  const loadCart = async (
    input: { binCode: string } | { productCode: string; quantity: number }
  ) => {
    try {
      const response = await load(input)
      await getMyCart()

      if (response.success) {
        setError(null)

        if ('binCode' in input) {
          setSourceBin(input.binCode)
        }

        navigate('/')
        return { success: true }
      } else {
        const msg = response.data?.error || '❌ Failed to load to cart.'
        setError(msg)
        return { success: false, error: msg }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || '❌ Error loading cart'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  const unloadCart = async (
    binCode: string,
    unloadProductList: unloadInventory[]
  ) => {
    try {
      const response = await unload(binCode, unloadProductList)

      if (response?.success) {
        const inventoriesLeftInCart = inventoriesInCar
          .map(item => {
            const selected = unloadProductList.find(
              s => s.inventoryID === item.inventoryID
            )
            if (selected) {
              const remainingQty = item.quantity - Number(selected.quantity)
              return remainingQty > 0
                ? { ...item, quantity: remainingQty }
                : null
            }
            return item
          })
          .filter(Boolean)

        setInventoriesInCar(inventoriesLeftInCart as InventoryItem[])
        setError(null)
        navigate(inventoriesLeftInCart.length === 0 ? '/success' : '/my-task')
      } else {
        setError(response?.data?.error || '❌ Failed to unload cart.')
      }

      return response
    } catch (err: any) {
      const msg = err?.response?.data?.message || '❌ Error unloading cart'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  return { loadCart, unloadCart, isCartEmpty, getMyCart, error, sourceBin }
}
