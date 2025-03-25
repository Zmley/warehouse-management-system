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
  hasProductInCar: boolean
  inventories: InventoryItem[]
  selectedForUnload: { inventoryID: string; quantity: number }[]
  setSelectedForUnload: (
    list: { inventoryID: string; quantity: number }[]
  ) => void
  getMyCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useProductContext = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useProductContext must be used within a ProductProvider')
  }
  return context
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [hasProductInCar, setHasProductInCar] = useState(false)
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [selectedForUnload, setSelectedForUnload] = useState<
    { inventoryID: string; quantity: number }[]
  >([])

  const getMyCart = async () => {
    try {
      const response = await getInventoriesByCart()
      setHasProductInCar(response.hasProductInCar)
      setInventories(response.inventories || [])

      if (!response.hasProductInCar) {
        localStorage.removeItem('sourceBinCode')
        localStorage.removeItem('destinationBinCode')
      }
    } catch (error) {
      console.error('❌ Failed to check Product status:', error)
    }
  }

  useEffect(() => {
    getMyCart()
  }, [])

  return (
    <CartContext.Provider
      value={{
        hasProductInCar,
        inventories,
        selectedForUnload,
        setSelectedForUnload,
        getMyCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
