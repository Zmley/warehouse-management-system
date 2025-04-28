export interface BinUploadPayload {
  warehouseID: string
  binCode: string
  type: 'INVENTORY' | 'PICK_UP' | 'CART'
  defaultProductCodes: string[] | null
}

export interface GetBinsParams {
  warehouseID: string
  type?: string
  keyword?: string
  page: number
  limit: number
}
