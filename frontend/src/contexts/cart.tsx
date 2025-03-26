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
  inventories: InventoryItem[]
  hasProductInCar: boolean
  selectedForUnload: { inventoryID: string; quantity: number }[]
  setSelectedForUnload: (
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
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [selectedForUnload, setSelectedForUnload] = useState<
    { inventoryID: string; quantity: number }[]
  >([])

  const getMyCart = async () => {
    try {
      const response = await getInventoriesByCart()
      const list = response.inventories || []

      setInventories(list)

      if (list.length === 0) {
        localStorage.removeItem('sourceBinCode')
        localStorage.removeItem('destinationBinCode')
      }
    } catch (error) {
      console.error('❌ Failed to fetch cart:', error)
    }
  }

  useEffect(() => {
    getMyCart()
  }, [])

  const [justUnloadedSuccess, setJustUnloadedSuccess] = useState(false)

  return (
    <CartContext.Provider
      value={{
        inventories,
        hasProductInCar: inventories.length > 0,
        selectedForUnload,
        setSelectedForUnload,
        getMyCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
