import { BinType } from 'constants/index'
import Bin from 'routes/bins/bin.model'

export interface BinUploadPayload {
  warehouseID: string
  binCode: string
  type: BinType.INVENTORY | BinType.PICK_UP | BinType.CART
  defaultProductCodes: string[] | null
}

export interface GetBinsParams {
  warehouseID: string
  page: number
  limit: number
  type?: string
  keyword?: string
}

export interface SourceBinItem {
  bin?: {
    binCode?: string
  }
}

export type UpdateBinInput = {
  binID: string
  binCode?: string
  type?: BinType
  defaultProductCodes?: string | null
}

export type UpdateBinsResult = {
  success: boolean
  updatedCount: number
  failedCount: number
  results: Array<
    | { binID: string; success: true; bin: Bin }
    | { binID: string; success: false; errorCode: string; message: string }
  >
}

export type UpdateBinDto = {
  warehouseID?: string
  binCode?: string
  type?: BinType
  defaultProductCodes?: string | null
}
