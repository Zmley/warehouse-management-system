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
  isCarEmpty: boolean
  setIsCarEmpty: (hasProduct: boolean) => void
  selectedToUnload: { inventoryID: string; quantity: number }[]
  setSelectedToUnload: (
    list: { inventoryID: string; quantity: number }[]
  ) => void
  getMyCart: () => Promise<void>
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
  const [inventoriesInCar, setInventoryListInCar] = useState<InventoryItem[]>(
    []
  )
  const [selectedToUnload, setSelectedToUnload] = useState<
    { inventoryID: string; quantity: number }[]
  >([])

  const [isCarEmpty, setIsCarEmpty] = useState<boolean>(false)

  const [destinationBinCode, setDestinationBinCode] = useState<string | null>(
    null
  )

  const getMyCart = async () => {
    try {
      const response = await getInventoriesInCart()
      const list = response.inventories || []

      setInventoryListInCar(list)

      setIsCarEmpty(list.length > 0)
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
        setIsCarEmpty,
        inventoriesInCar,
        isCarEmpty,
        selectedToUnload,
        setSelectedToUnload,
        getMyCart,
        destinationBinCode,
        setDestinationBinCode
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
