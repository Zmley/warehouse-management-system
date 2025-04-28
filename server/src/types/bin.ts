import { BinType } from 'constants/binType'

export interface BinUploadPayload {
  warehouseID: string
  binCode: string
  type: BinType.INVENTORY | BinType.PICK_UP | BinType.CART
  defaultProductCodes: string[] | null
}

export interface GetBinsParams {
  warehouseID: string
  type?: string
  keyword?: string
  page: number
  limit: number
}
