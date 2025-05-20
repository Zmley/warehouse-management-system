import { Request, Response, NextFunction } from 'express'
import * as binService from 'routes/bins/bin.service'
import { getBinByProductCode } from 'routes/bins/bin.service'

export const getBin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { binCode } = req.params

    const bin = await binService.getBinByBinCode(binCode)

    res.status(200).json({
      message: 'Bin fetched successfully',
      success: true,
      bin: bin
    })
  } catch (error) {
    next(error)
  }
}

export const getAvailableBinCodes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productCode } = req.params
    const { warehouseID } = res.locals

    const binCodes = await binService.getBinCodesByProductCode(
      productCode,
      warehouseID
    )

    res.status(200).json({
      success: true,
      message: 'Bin codes fetched successfully',
      binCodes
    })
  } catch (error) {
    next(error)
  }
}

export const getBinCodes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const warehouseID = req.query.warehouseID as string

    if (!warehouseID) {
      return res.status(400).json('warehouseID is required')
    }

    const data = await binService.getBinCodesInWarehouse(warehouseID)

    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export const getBins = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { warehouseID, type, keyword, page = '1', limit = '10' } = req.query

    if (!warehouseID || typeof warehouseID !== 'string') {
      res.status(400).json({ message: 'Missing or invalid warehouseID' })
      return
    }

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
  } catch (error) {
    next(error)
  }
}

export const addBins = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const binList = req.body

    if (!Array.isArray(binList)) {
      res
        .status(400)
        .json({ success: false, message: 'Invalid payload format' })
      return
    }

    const result = await binService.addBins(binList)

    res.status(200).json({
      success: true,
      insertedCount: result.insertedCount,
      skippedCount: result.skipped.length,
      duplicatedBinCodes: result.skipped.map(b => b.binCode)
    })
  } catch (err) {
    next(err)
  }
}

///

export const getPickUpBin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { warehouseID } = res.locals

    const { productCode } = req.params

    if (!productCode || !warehouseID) {
      return res.status(400).json({
        success: false,
        error: '❌ Missing productCode or warehouseID'
      })
    }

    const bins = await getBinByProductCode(
      String(productCode),
      String(warehouseID)
    )

    res.json({ success: true, data: bins })
  } catch (error) {
    next(error)
  }
}

export const checkIfPickUpBin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { binCode } = req.params

    if (!binCode) {
      return res.status(400).json({
        success: false,
        error: '❌ Missing binCode'
      })
    }

    const isPickUp = await binService.isPickUpBin(binCode)

    res.status(200).json({
      success: isPickUp
      // isPickUpBin: isPickUp
    })
  } catch (error) {
    next(error)
  }
}
