import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { getInventoriesInCart } from 'api/cart'
import { InventoryItem } from 'types/inventory'

interface CartContextType {
  inventoriesInCart: InventoryItem[]
  isCartEmpty: boolean
  selectedToUnload: { inventoryID: string; quantity: number }[]
  setSelectedToUnload: (
    list: { inventoryID: string; quantity: number }[]
  ) => void
  getMyCart: () => Promise<void>
  setInventoriesInCart: (list: InventoryItem[]) => void
  sourceBin: string | null
  setSourceBin: (code: string | null) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCartContext = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider')
  }
  return context
}

export const TransportWorkCartProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [inventoriesInCart, setInventoriesInCart] = useState<InventoryItem[]>(
    []
  )
  const [selectedToUnload, setSelectedToUnload] = useState<
    { inventoryID: string; quantity: number }[]
  >([])

  const isCartEmpty = inventoriesInCart.length === 0

  const [sourceBin, setSourceBin] = useState<string | null>(() => {
    return localStorage.getItem('sourceBinCode') || null
  })

  const getMyCart = async () => {
    try {
      const response = await getInventoriesInCart()
      const list = response.data.inventories || []

      setInventoriesInCart(list)
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
        inventoriesInCart,
        isCartEmpty,
        selectedToUnload,
        setSelectedToUnload,
        setInventoriesInCart,
        sourceBin,
        setSourceBin
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
