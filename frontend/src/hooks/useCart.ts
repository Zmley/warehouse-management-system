import { useCartContext } from '../contexts/cart'
import { loadToCart, unloadFromCart } from '../api/cartApi'
import { useNavigate } from 'react-router-dom'

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
        const inventoriesLeftInCart = inventoriesInCar.filter(
          item =>
            !selectedToUnload.some(
              selected => selected.inventoryID === item.inventoryID
            )
        )
        setInventoriesInCar(inventoriesLeftInCart)
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
