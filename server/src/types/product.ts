import { transferTaskStatus } from 'constants/index'

export interface ProductUploadInput {
  productCode: string
  barCode: string
  boxType: string
}

export type ProductPlain = {
  productCode: string
  barCode: string
  boxType: string
  createdAt: Date
  updatedAt: Date
}

export interface BoxUploadInput {
  productCode: string
  barCode: string
  boxType: string
}

export type CurAggRow = {
  productCode: string
  totalQuantity: number | string
}

export type OtherInvRow = {
  inventoryID: string
  productCode: string
  quantity: number
  bin: {
    binID: string
    binCode: string
    warehouseID: string
    type: string
    warehouse?: { warehouseID: string; warehouseCode: string }
    inventories?: Array<{
      inventoryID: string
      productCode: string
      quantity: number
      binID: string
    }>
  }
}

export type ProductLowDTO = {
  productCode: string
  barCode?: string | null
  boxType?: string | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null

  totalQuantity: number
  otherInventories: Array<{
    productCode: string
    quantity: number
    binTotal: number
    bin: OtherInvRow['bin']
  }>
  hasPendingTransfer: boolean
  transferStatus: transferTaskStatus | null
  transfersCount: number
  hasPendingOutofstockTask: string | null
}
