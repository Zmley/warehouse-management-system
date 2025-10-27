import { Request, Response } from 'express'
import {
  createTransferByTaskID,
  deleteTransfersByIDs,
  //   deleteTransfersByTaskID,
  getTransfersByWarehouseID,
  updateTransferStatus
} from './transfer.service'
import httpStatus from 'http-status'
import { TaskStatus } from 'constants/index'
import { randomUUID } from 'crypto'

export const fetchTransfers = async (req: Request, res: Response) => {
  const { warehouseID, status, page = '1', limit } = req.query

  if (typeof warehouseID !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'warehouseID is required' })
  }

  const limitNum = Math.min(200, Math.max(1, Number(limit) || 10))
  const pageNum = Math.max(1, Number(page) || 1)

  const { rows, count } = await getTransfersByWarehouseID({
    warehouseID,
    status: typeof status === 'string' ? (status as TaskStatus) : undefined,
    page: pageNum,
    limit: limitNum
  })

  res.json({ success: true, transfers: rows, total: count, page: pageNum })
}

type CreateTransferInput = {
  taskID?: string | null
  sourceWarehouseID: string
  destinationWarehouseID: string
  sourceBinID?: string | null
  productCode: string
  quantity: number
  createdBy: string
  batchID?: string
}

export const createTransfers = async (req: Request, res: Response) => {
  const createdBy = res.locals.accountID
  const itemsRaw = Array.isArray(req.body?.items) ? req.body.items : [req.body]
  const items = itemsRaw?.filter(Boolean) ?? []

  if (!items.length) {
    return res.status(400).json({ success: false, message: 'No items' })
  }

  const binBatchMap = new Map<string, string>()
  const enrichedItems: CreateTransferInput[] = items.map(i => {
    const binKey = String(i?.sourceBinID ?? 'NULL_BIN')
    if (!binBatchMap.has(binKey)) {
      binBatchMap.set(binKey, randomUUID())
    }
    return {
      taskID: i?.taskID ?? null,
      sourceWarehouseID: i.sourceWarehouseID,
      destinationWarehouseID: i.destinationWarehouseID,
      sourceBinID: i?.sourceBinID ?? null,
      productCode: i.productCode,
      quantity: Number(i.quantity ?? 0),
      createdBy,
      batchID: binBatchMap.get(binKey)!
    }
  })

  const settled = await Promise.allSettled(
    enrichedItems.map(i => createTransferByTaskID(i))
  )

  const ok = settled.flatMap(r => (r.status === 'fulfilled' ? [r.value] : []))
  const fail = settled.length - ok.length

  return res.status(ok.length ? 201 : 400).json({
    success: fail === 0,
    createdCount: ok.length,
    failedCount: fail,
    transfers: ok
  })
}

export const deleteTransfersByIDsCtrl = async (req: Request, res: Response) => {
  const transferIDs = Array.isArray(req.body?.transferIDs)
    ? (req.body.transferIDs as string[])
    : undefined

  if (!transferIDs || transferIDs.length === 0) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: 'No transferIDs provided' })
  }

  const { count } = await deleteTransfersByIDs({ transferIDs })

  if (!count) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'No pending transfers found for given transferIDs'
    })
  }

  return res.status(httpStatus.OK).json({ success: true, count })
}

export const updateReceiveStatus = async (req: Request, res: Response) => {
  const { items, action, force } = req.body
  if (!Array.isArray(items) || !items.length) {
    return res
      .status(400)
      .json({ success: false, message: 'items is required' })
  }
  const result = await updateTransferStatus(items, action, {
    force: !!force
  })
  return res.json(result)
}
