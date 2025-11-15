import { BinType } from 'constants/index'
import httpStatus from 'constants/httpStatus'
import { Request, Response } from 'express'
import * as binService from 'routes/bins/bin.service'
import {
  getEmptyBinsInWarehouse,
  getPickBinByProductCode,
  updateSingleBin
} from 'routes/bins/bin.service'
import { asyncHandler } from 'utils/asyncHandler'
import { UpdateBinDto, UpdateBinInput } from 'types/bin'

export const getBin = asyncHandler(async (req: Request, res: Response) => {
  const { binCode } = req.params

  const warehouseID = res.locals.warehouseID
  const bin = await binService.getBinByBinCode(binCode, warehouseID)
  res.status(200).json({
    success: true,
    bin
  })
})

export const getAvailableBinCodes = asyncHandler(
  async (req: Request, res: Response) => {
    const { productCode } = req.params
    const { warehouseID } = res.locals

    const binCodes = await binService.getBinCodesByProductCode(
      productCode,
      warehouseID
    )

    res.status(200).json({
      success: true,
      binCodes
    })
  }
)

export const getBinCodes = asyncHandler(async (req: Request, res: Response) => {
  const warehouseID = req.query.warehouseID as string
  const data = await binService.getBinCodesInWarehouse(warehouseID)
  res.status(200).json({ success: true, data })
})

export const getBins = asyncHandler(async (req: Request, res: Response) => {
  const { type, keyword, page = '1', limit = '10' } = req.query
  const warehouseID = req.query.warehouseID as string

  const parsedPage = parseInt(page as string, 10)
  const parsedLimit = parseInt(limit as string, 10)

  const { data, total } = await binService.getBins(
    warehouseID,
    parsedPage,
    parsedLimit,
    typeof type === 'string' ? type : undefined,
    typeof keyword === 'string' ? keyword : undefined
  )

  res.status(200).json({ data, total })
})

export const addBins = asyncHandler(async (req: Request, res: Response) => {
  const binList = req.body

  if (!Array.isArray(binList)) {
    res.status(400).json({ success: false, message: 'Invalid payload format' })
    return
  }

  const result = await binService.addBins(binList)

  res.status(200).json({
    success: true,
    insertedCount: result.insertedCount,
    updatedCount: result.updatedCount
  })
})

export const getPickUpBin = asyncHandler(
  async (req: Request, res: Response) => {
    const { warehouseID } = res.locals
    const { productCode } = req.params

    if (!productCode || !warehouseID) {
      res.status(400).json({
        success: false,
        error: '❌ Missing productCode or warehouseID'
      })
      return
    }

    const bins = await getPickBinByProductCode(
      String(productCode),
      String(warehouseID)
    )
    res.json({ success: true, data: bins })
  }
)

export const checkIfPickUpBin = asyncHandler(
  async (req: Request, res: Response) => {
    const { binCode } = req.params

    if (!binCode) {
      res.status(400).json({
        success: false,
        error: '❌ Missing binCode'
      })
      return
    }

    const isPickUp = await binService.isPickUpBin(binCode)
    res.status(200).json({ success: isPickUp })
  }
)

export const updateDefaultProductCodes = asyncHandler(
  async (req: Request, res: Response) => {
    const { binID } = req.params
    const { defaultProductCodes } = req.body

    if (!binID) {
      res.status(400).json({ success: false, error: 'binID is required' })
      return
    }
    if (!defaultProductCodes && defaultProductCodes !== '') {
      res
        .status(400)
        .json({ success: false, error: 'defaultProductCodes is required' })
      return
    }

    const updatedBin = await binService.updateDefaultProductCodes(
      binID,
      defaultProductCodes
    )
    if (!updatedBin) {
      res.status(404).json({ success: false, error: 'Bin not found' })
      return
    }
    res.json({ success: true, data: updatedBin })
  }
)

export const deleteBin = asyncHandler(async (req: Request, res: Response) => {
  const { binID } = req.params
  const result = await binService.deleteBinByBInID(binID)

  if (!result) {
    res.status(404).json({ success: false, error: 'Bin not found' })
    return
  }

  res.json({ success: true })
})

export const updateBinsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { updates } = req.body as { updates: UpdateBinInput[] }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        errorCode: 'INVALID_PAYLOAD',
        message: 'updates must be a non-empty array'
      })
    }

    const invalid = updates.find(
      u => !u || typeof u.binID !== 'string' || !u.binID
    )
    if (invalid) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        errorCode: 'BIN_ID_REQUIRED',
        message: 'Each update item must include a valid binID'
      })
    }

    const result = await binService.updateBins(updates)

    if (result.failedCount === 0) {
      return res.status(httpStatus.OK).json({
        success: true,
        updatedCount: result.updatedCount,
        failedCount: result.failedCount,
        results: result.results
      })
    }

    if (result.updatedCount > 0 && result.failedCount > 0) {
      return res.status(httpStatus.MULTI_STATUS).json({
        success: false,
        errorCode: 'PARTIAL_FAILURE',
        updatedCount: result.updatedCount,
        failedCount: result.failedCount,
        results: result.results
      })
    }

    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      errorCode: 'UPDATE_FAILED',
      updatedCount: result.updatedCount,
      failedCount: result.failedCount,
      results: result.results
    })
  }
)

export const updateBinController = asyncHandler(
  async (req: Request, res: Response) => {
    const { binID } = req.params as { binID: string }

    const { binCode, type, defaultProductCodes } = req.body ?? {}

    const payload: UpdateBinDto = {}

    if (binCode !== undefined) {
      payload.binCode = String(binCode).trim()
    }

    if (type !== undefined) {
      payload.type = type as BinType
    }

    if (defaultProductCodes !== undefined) {
      payload.defaultProductCodes =
        defaultProductCodes === null ? null : String(defaultProductCodes)
    }

    const bin = await updateSingleBin(binID, payload)

    res.status(200).json({
      success: true,
      bin
    })
  }
)

export const getBinColumns = asyncHandler(
  async (req: Request, res: Response) => {
    const warehouseID = (req.query.warehouseID as string) || undefined
    const columns = await binService.getBinColumnsInWarehouse(warehouseID)
    res.status(200).json({ success: true, columns })
  }
)

export const getEmptyBins = async (req: Request, res: Response) => {
  try {
    const warehouseID =
      (req.query.warehouseID as string) ||
      res.locals?.currentAccount?.warehouseID

    const q = (req.query.q as string) || ''
    const limit = req.query.limit ? Number(req.query.limit) : 50

    const bins = await getEmptyBinsInWarehouse(warehouseID, { q, limit })

    res.json({
      success: true,
      warehouseID,
      count: bins.length,
      bins
    })
  } catch (err) {
    console.error('❌ Error fetching empty bins:', err)
    res.status(err?.statusCode || 500).json({
      success: false,
      message: err?.message || 'Internal Server Error'
    })
  }
}
