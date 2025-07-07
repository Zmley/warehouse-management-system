import { useState } from 'react'
import { useCartContext } from 'contexts/cart'
import { load, unload } from 'api/cart'
import { useNavigate } from 'react-router-dom'
import { InventoryItem } from 'types/inventory'
import { unloadInventory } from 'types/inventory'

export const useCart = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    getMyCart,
    isCartEmpty,
    setInventoriesInCart,
    inventoriesInCart,
    sourceBin,
    setSourceBin
  } = useCartContext()

  const loadCart = async (
    input:
      | { productCode: string; quantity: number }
      | {
          binCode: string
          selectedItems: { inventoryID: string; quantity: number }[]
        }
  ) => {
    try {
      const response = await load(input)
      await getMyCart()

      if (response.data.success) {
        setError(null)

        if ('binCode' in input) {
          setSourceBin(input.binCode)
        }

        navigate('/success')
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
      setError(null)

      const response = await unload({ binCode, unloadProductList })

      if (response?.data.success) {
        const inventoriesLeftInCart = inventoriesInCart
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

        setInventoriesInCart(inventoriesLeftInCart as InventoryItem[])

        navigate('/success')
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
