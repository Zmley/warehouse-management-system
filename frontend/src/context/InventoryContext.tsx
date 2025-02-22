import React, { createContext, useContext, useState, ReactNode } from "react";
import { InventoryItem } from "../types/inventoryTypes";

interface InventoryContextType {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// ✅ Provider 组件
export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  return (
    <InventoryContext.Provider value={{ inventory, setInventory }}>
      {children}
    </InventoryContext.Provider>
  );
};

// ✅ Hook 方便使用 Context
export const useInventoryContext = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventoryContext must be used within an InventoryProvider");
  }
  return context;
};