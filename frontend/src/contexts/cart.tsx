// src/context/CargoContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { checkHasCargoInCar } from '../api/cartApi'
import { InventoryItem } from '../types/inventory'

interface CartContextType {
  hasCargoInCar: boolean
  inventories: InventoryItem[]
  selectedForUnload: { inventoryID: string; quantity: number }[]
  setSelectedForUnload: (
    list: { inventoryID: string; quantity: number }[]
  ) => void
  refreshCargoStatus: () => Promise<void>
}

const CargoContext = createContext<CartContextType | undefined>(undefined)

export const useCargoContext = (): CartContextType => {
  const context = useContext(CargoContext)
  if (!context) {
    throw new Error('useCargoContext must be used within a CargoProvider')
  }
  return context
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [hasCargoInCar, setHasCargoInCar] = useState(false)
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [selectedForUnload, setSelectedForUnload] = useState<
    { inventoryID: string; quantity: number }[]
  >([])

  const refreshCargoStatus = async () => {
    try {
      const response = await checkHasCargoInCar()
      setHasCargoInCar(response.hasCargoInCar)
      setInventories(response.inventories || [])

      if (!response.hasCargoInCar) {
        localStorage.removeItem('sourceBinCode')
        localStorage.removeItem('destinationBinCode')
      }
    } catch (error) {
      console.error('❌ Failed to check cargo status:', error)
    }
  }

  useEffect(() => {
    refreshCargoStatus()
  }, [])

  return (
    <CargoContext.Provider
      value={{
        hasCargoInCar,
        inventories,
        selectedForUnload,
        setSelectedForUnload,
        refreshCargoStatus
      }}
    >
      {children}
    </CargoContext.Provider>
  )
}
