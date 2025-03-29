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
  inventoryListInCar: InventoryItem[]
  hasProductInCar: boolean
  selectedInventoriesToUnload: { inventoryID: string; quantity: number }[]
  setSelectedForUnload: (
    list: { inventoryID: string; quantity: number }[]
  ) => void
  getMyCart: () => Promise<void>
  setHasProductInCar: (hasProduct: boolean) => void
  destinationBinCode: string | null
  setDestinationBinCode: (code: string | null) => void
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
  const [inventoryListInCar, setInventoryListInCar] = useState<InventoryItem[]>(
    []
  )
  const [selectedInventoriesToUnload, setSelectedForUnload] = useState<
    { inventoryID: string; quantity: number }[]
  >([])

  const [hasProductInCar, setHasProductInCar] = useState<boolean>(false)

  const [destinationBinCode, setDestinationBinCode] = useState<string | null>(
    null
  )

  const getMyCart = async () => {
    try {
      const response = await getInventoriesByCart()
      const list = response.inventories || []

      setInventoryListInCar(list)

      setHasProductInCar(response.hasProductInCar)
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
        setHasProductInCar,
        inventoryListInCar,
        hasProductInCar,
        selectedInventoriesToUnload,
        setSelectedForUnload,
        getMyCart,
        destinationBinCode,
        setDestinationBinCode
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
