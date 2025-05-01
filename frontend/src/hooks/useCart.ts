import { useState } from 'react'
import { useCartContext } from 'contexts/cart'
import { loadToCart, unloadFromCart } from 'api/cartApi'
import { useNavigate } from 'react-router-dom'
import { InventoryItem } from 'types/inventory'

export const useCart = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    selectedToUnload,
    getMyCart,
    isCartEmpty,
    setInventoriesInCar,
    inventoriesInCar
  } = useCartContext()

  const loadCart = async (binCode: string) => {
    try {
      const response = await loadToCart(binCode)
      await getMyCart()

      if (response?.success) {
        setError(null)
        setTimeout(() => {
          navigate('/my-task')
        }, 500)
      } else {
        setError(response?.data?.error || '❌ Failed to load to cart.')
      }

      return response
    } catch (err: any) {
      const msg = err?.response?.data?.error || '❌ Error loading cart'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  const unloadCart = async (binCode: string) => {
    try {
      const response = await unloadFromCart(binCode, selectedToUnload)
      if (response?.success) {
        const inventoriesLeftInCart = inventoriesInCar
          .map(item => {
            const selected = selectedToUnload.find(
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
        setTimeout(() => {
          navigate(inventoriesLeftInCart.length === 0 ? '/success' : '/my-task')
        }, 500)
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

  return { loadCart, unloadCart, isCartEmpty, getMyCart, error }
}
