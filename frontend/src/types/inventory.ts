export interface InventoryItem {
  bin: {
    binCode: string
    binID: string
  }
  inventoryID: string
  binID: string
  productCode: string
  quantity: number
}

export interface unloadInventory {
  inventoryID: string
  quantity: number
}
