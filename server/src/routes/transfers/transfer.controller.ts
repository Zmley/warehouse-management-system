import { Request, Response } from 'express'
import {
  createTransferByTaskID,
  deleteTransfersByTaskID,
  getTransfersByWarehouseID,
  updateTransferStatus
} from './transfer.service'
import httpStatus from 'http-status'
import { TaskStatus } from 'constants/index'

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

export const createTransfers = async (req: Request, res: Response) => {
  const createdBy = res.locals.accountID
  const items = Array.isArray(req.body?.items) ? req.body.items : [req.body]
  if (!items.length)
    return res.status(400).json({ success: false, message: 'No items' })

  const settled = await Promise.allSettled(
    items.map(i => createTransferByTaskID({ ...i, createdBy }))
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

export const deleteTransfersByTask = async (req: Request, res: Response) => {
  const { taskID } = req.params
  const sourceBinID =
    typeof req.query.sourceBinID === 'string'
      ? req.query.sourceBinID
      : undefined
  if (!taskID) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: 'No taskID provided' })
  }

  const { count } = await deleteTransfersByTaskID({
    taskID,
    sourceBinID,
    deletedBy: res.locals.accountID
  })

  if (!count) {
    const msg = sourceBinID
      ? `No pending transfers found for taskID=${taskID} & sourceBinID=${sourceBinID}`
      : `No pending transfers found for taskID=${taskID}`
    return res
      .status(httpStatus.NOT_FOUND)
      .json({ success: false, message: msg })
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
