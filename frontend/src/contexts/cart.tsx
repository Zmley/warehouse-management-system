import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { getInventoriesInCart } from '../api/cartApi'
import { InventoryItem } from '../types/inventory'

interface CartContextType {
  inventoriesInCar: InventoryItem[]
  isCartEmpty: boolean
  selectedToUnload: { inventoryID: string; quantity: number }[]
  setSelectedToUnload: (
    list: { inventoryID: string; quantity: number }[]
  ) => void
  getMyCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCartContext = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [inventoriesInCar, setInventoriesInCar] = useState<InventoryItem[]>([])
  const [selectedToUnload, setSelectedToUnload] = useState<
    { inventoryID: string; quantity: number }[]
  >([])

  const isCartEmpty = inventoriesInCar.length === 0

  const getMyCart = async () => {
    try {
      const response = await getInventoriesInCart()
      const list = response.inventories || []

      setInventoriesInCar(list)
    } catch (error) {
      console.error('❌ Failed to fetch cart:', error)
    }
  }

  useEffect(() => {
    getMyCart()
  }, [])

  return (
    <CartContext.Provider
      value={{
        getMyCart,
        inventoriesInCar,
        isCartEmpty,
        selectedToUnload,
        setSelectedToUnload
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
