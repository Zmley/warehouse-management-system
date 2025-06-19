export interface InventoryItem {
  inventoryID: string
  binID: string
  productCode: string
  quantity: number
}

export interface unloadInventory {
  inventoryID: string
  quantity: number
}
