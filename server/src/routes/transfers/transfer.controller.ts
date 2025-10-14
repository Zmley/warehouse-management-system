import { Request, Response } from 'express'
import {
  cancelTransferService,
  createTransferService,
  deleteTransfersByTaskService,
  getTransfersByWarehouseID
} from './transfer.service'
import httpStatus from 'http-status'

type ListQuery = {
  warehouseID: string
  status?: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELED'
  page?: string
  limit?: string
}

export const fetchTransfers = async (req: Request, res: Response) => {
  try {
    const {
      warehouseID,
      status,
      page = '1',
      limit
    } = req.query as unknown as ListQuery

    if (!warehouseID) {
      return res
        .status(400)
        .json({ success: false, message: 'warehouseID is required' })
    }

    const PAGE_DEFAULT = 10
    const PAGE_MAX = 200
    const limitNum = Math.min(
      PAGE_MAX,
      Math.max(1, Number(limit ?? PAGE_DEFAULT) || PAGE_DEFAULT)
    )

    const pageNum = Math.max(1, Number(page) || 1)

    const {
      rows,
      count,
      page: currentPage
    } = await getTransfersByWarehouseID({
      warehouseID,
      status,
      page: pageNum,
      limit: limitNum
    })

    res.json({
      success: true,
      transfers: rows,
      total: count,
      page: currentPage
    })
  } catch (err) {
    console.error('fetchTransfers error:', err)
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Internal error'
    })
  }
}

export const createTransferController = async (req: Request, res: Response) => {
  try {
    const transfer = await createTransferService({
      ...req.body,
      createdBy: res.locals.accountID
    })
    res.status(201).json({ success: true, transfer })
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : 'Bad request'
    })
  }
}

////////////
export const cancelTransferController = async (req: Request, res: Response) => {
  try {
    const { transferID } = req.params
    const transfer = await cancelTransferService({
      transferID,
      canceledBy: res.locals.accountID
    })

    return res.json({
      success: true,
      transfer
    })
  } catch (err) {
    console.error('cancelTransferController error:', err)
    return res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : 'Bad request'
    })
  }
}

//////////////

export const deleteTransfersByTaskController = async (
  req: Request,
  res: Response
) => {
  try {
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

    const { count } = await deleteTransfersByTaskService({
      taskID,
      sourceBinID,
      deletedBy: res.locals.accountID // 如需审计，这里可用
    })

    if (!count) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: sourceBinID
          ? `No pending transfers found for taskID=${taskID} & sourceBinID=${sourceBinID}`
          : `No pending transfers found for taskID=${taskID}`
      })
    }

    return res.status(httpStatus.OK).json({ success: true, count })
  } catch (err: any) {
    console.error('❌ deleteTransfersByTaskController error:', err)
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err?.message || 'Internal server error'
    })
  }
}

///////////////////

// transfer.controller.ts
import { confirmReceiveService, ConfirmItem } from './transfer.service'

export const confirmReceiveController = async (req: Request, res: Response) => {
  try {
    const items = req.body?.items as ConfirmItem[] | undefined
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'items is required' })
    }

    const result = await confirmReceiveService(items)
    return res.json({ success: true, ...result })
  } catch (err: any) {
    console.error('confirmReceiveController error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error'
    })
  }
}
