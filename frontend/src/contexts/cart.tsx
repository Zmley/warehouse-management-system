import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { getInventoriesByCart } from '../api/cartApi'
import { InventoryItem } from '../types/inventory'

interface CartContextType {
  inventoriesInCar: InventoryItem[]
  hasProductInCar: boolean
  selectedInventoriesToUnload: { inventoryID: string; quantity: number }[]
  setSelectedForUnload: (
    list: { inventoryID: string; quantity: number }[]
  ) => void
  getMyCart: () => Promise<void>
  justUnloadedSuccess: boolean
  setJustUnloadedSuccess: (value: boolean) => void
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
  const [selectedInventoriesToUnload, setSelectedForUnload] = useState<
    { inventoryID: string; quantity: number }[]
  >([])
  const [justUnloadedSuccess, setJustUnloadedSuccess] = useState(false)

  const getMyCart = async () => {
    try {
      const response = await getInventoriesByCart()
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
        inventoriesInCar,
        hasProductInCar: inventoriesInCar.length > 0,
        selectedInventoriesToUnload,
        setSelectedForUnload,
        getMyCart,
        justUnloadedSuccess,
        setJustUnloadedSuccess
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
