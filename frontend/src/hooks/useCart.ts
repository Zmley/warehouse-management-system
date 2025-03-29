import { useCartContext } from '../contexts/cart'
import { loadToCart, unloadFromCart } from '../api/cartApi'
import { useNavigate } from 'react-router-dom'

export const useCart = () => {
  const navigate = useNavigate()

  const { selectedToUnload, getMyCart, setDestinationBinCode, isCartEmpty } =
    useCartContext()

  const loadCart = async (binCode: string) => {
    try {
      const response = await loadToCart(binCode)
      await getMyCart()
      setDestinationBinCode(null)

      if (response?.success) {
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
      setDestinationBinCode(binCode)

      const response = await unloadFromCart(binCode, selectedToUnload)
      if (response?.success) {
        await getMyCart()
        if (isCartEmpty) {
          setTimeout(() => {
            navigate('/success')
          }, 500)
        } else {
          setDestinationBinCode(binCode)
          setTimeout(() => {
            navigate('/in-process-task')
          }, 500)
        }
      }
    } catch (error) {
      console.error('❌ Failed to unload from cart:', error)
    }
  }

  return { loadCart, unloadCart, isCartEmpty, getMyCart }
}
