import { Request, Response, NextFunction } from 'express'
import * as binService from '../bins/bin.service'

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

    const bins = await binService.getBinCodesInWarehouse(warehouseID)

    res.status(200).json(bins)
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

    const { data, total } = await binService.getBins({
      warehouseID,
      type: typeof type === 'string' ? type : undefined,
      keyword: typeof keyword === 'string' ? keyword : undefined,
      page: parsedPage,
      limit: parsedLimit
    })
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
