import { useCartContext } from '../contexts/cart'
import { loadToCart, unloadFromCart } from '../api/cartApi'
import { useNavigate } from 'react-router-dom'
import { InventoryItem } from '../types/inventory'
import { useState } from 'react'

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
      }
    } catch (err: any) {
      console.error('❌ Failed to load to cart:', err)
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        '❌ Failed to load Product due to an internal error.'
      setError(message)
    }
  }

  const unloadCart = async (binCode: string) => {
    try {
      const response = await unloadFromCart(binCode, selectedToUnload)
      if (response?.success) {
        setError(null) // 清空旧错误
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
        setTimeout(() => {
          navigate(inventoriesLeftInCart.length === 0 ? '/success' : '/my-task')
        }, 500)
      }
    } catch (err: any) {
      console.error('❌ Failed to unload from cart:', err)
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        '❌ Failed to unload Product due to an internal error.'
      setError(message)
    }
  }

  return { loadCart, unloadCart, isCartEmpty, getMyCart, error }
}
