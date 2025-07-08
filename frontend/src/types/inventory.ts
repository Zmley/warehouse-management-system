export interface InventoryItem {
  bin: any
  inventoryID: string
  binID: string
  productCode: string
  quantity: number
}

export interface unloadInventory {
  inventoryID: string
  quantity: number
}
