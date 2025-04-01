import { useCartContext } from '../contexts/cart'
import { loadToCart, unloadFromCart } from '../api/cartApi'
import { useNavigate } from 'react-router-dom'
import { InventoryItem } from '../types/inventory'

export const useCart = () => {
  const navigate = useNavigate()

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
        setTimeout(() => {
          navigate('/my-task')
        }, 500)
      }
    } catch (error) {
      console.error('❌ Failed to load to cart:', error)
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
        if (inventoriesLeftInCart.length === 0) {
          setTimeout(() => {
            navigate('/success')
          }, 500)
        } else {
          setTimeout(() => {
            navigate('/my-task')
          }, 500)
        }
      }
    } catch (error) {
      console.error('❌ Failed to unload from cart:', error)
    }
  }

  return { loadCart, unloadCart, isCartEmpty, getMyCart }
}
