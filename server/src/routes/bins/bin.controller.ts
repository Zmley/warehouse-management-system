import { Request, Response } from 'express'
import * as binService from 'routes/bins/bin.service'
import { getPickBinByProductCode } from 'routes/bins/bin.service'
import { asyncHandler } from 'utils/asyncHandler'

export const getBin = asyncHandler(async (req: Request, res: Response) => {
  const { binCode } = req.params
  const bin = await binService.getBinByBinCode(binCode)
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
