import { Request, Response, NextFunction } from 'express'
import * as binService from '../bins/bin.service'

export const getBinByBinCode = async (
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

export const getBinCodes = async (
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

export const getBinsInWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const warehouseID = req.query.warehouseID as string

    if (!warehouseID) {
      return res.status(400).json('warehouseID is required')
    }

    const bins = await binService.getBinsInWarehouse(warehouseID)

    res.status(200).json(bins)
  } catch (error) {
    next(error)
  }
}
