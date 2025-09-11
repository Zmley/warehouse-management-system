export interface UnloadInventory {
  inventoryID: string
  quantity: number
}

export type LoadPayload =
  | { binCode: string }
  | { productCode: string; quantity: number }
  | { productList: { productCode: string; quantity: number }[] }

export interface UnloadPayload {
  binCode: string
  unloadProductList: UnloadInventory[]
}
