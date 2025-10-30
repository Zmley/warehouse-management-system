export type SessionFilter = {
  accountID?: string
  workerName?: string
  keyword?: string
  start?: string | Date
  end?: string | Date
  productCode?: string
  sourceBinCode?: string
  destinationBinCode?: string
  type?: 'INVENTORY' | 'PICK_UP'
  limit?: number
  offset?: number
}

export type LogRow = {
  logID: string
  productCode: string
  quantity: number
  sourceBinID: string | null
  destinationBinID: string | null
  accountID: string
  sessionID: string
  isMerged: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export type Group = {
  sessionID: string
  accountID: string
  accountName: string | null
  startedAt: Date
  lastUpdatedAt: Date
  isCompleted: boolean
  destinations: Array<{
    destinationBinID: string | null
    destinationBinCode: string | null
    totalQuantity: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[]
  }>
}

export type Item = {
  productCode: string
  quantity: number
  isMerged?: boolean
}
