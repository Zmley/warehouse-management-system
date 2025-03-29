import { useCartContext } from '../contexts/cart'
import { loadToCart, unloadFromCart } from '../api/cartApi'
import { useNavigate } from 'react-router-dom'

export const useCart = () => {
  const navigate = useNavigate()

  const {
    hasProductInCar,
    selectedInventoriesToUnload,
    setJustUnloadedSuccess,
    getMyCart,
    setHasProductInCar,
    setDestinationBinCode
  } = useCartContext()

  const loadCart = async (binCode: string) => {
    try {
      const response = await loadToCart(binCode)
      if (response?.success) {
        setHasProductInCar(true)
        setDestinationBinCode(binCode)
        setJustUnloadedSuccess(true)
        await getMyCart()

        setTimeout(() => {
          navigate('/in-process-task')
        }, 500)
      }
    } catch (error) {
      console.error('❌ Failed to load to cart:', error)
    }
  }

  const unloadCart = async (binCode: string) => {
    try {
      const response = await unloadFromCart(
        binCode,
        selectedInventoriesToUnload
      )
      if (response?.success) {
        setJustUnloadedSuccess(true)
        await getMyCart()
        if (!response.data.hasProductInCar) {
          navigate('/success')
        } else {
          setTimeout(() => {
            navigate('/in-process-task')
          }, 500)
        }

        setDestinationBinCode(binCode)
      }
    } catch (error) {
      console.error('❌ Failed to unload from cart:', error)
    }
  }

  return { loadCart, unloadCart, hasProductInCar, getMyCart }
}
