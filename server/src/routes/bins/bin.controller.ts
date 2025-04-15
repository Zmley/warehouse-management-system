import { Request, Response, NextFunction } from 'express'
import { getAllBinsInWarehouse, getBinByBinCode } from './bin.service'
import { getBinCodesByProductCode } from '../bins/bin.service'

export const getBinByCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { warehouseID } = res.locals

    const { binCode } = req.params

    const bin = await getBinByBinCode(binCode, warehouseID)

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

    const binCodes = await getBinCodesByProductCode(productCode, warehouseID)

    res.status(200).json({
      message: 'Bin codes fetched successfully',
      binCodes
    })
  } catch (error) {
    next(error)
  }
}

//

export const getBinsForWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const warehouseID = req.query.warehouseID as string

    if (!warehouseID) {
      return res.status(400).json({ message: 'warehouseID is required' })
    }

    const bins = await getAllBinsInWarehouse(warehouseID)
    res.status(200).json({
      message: 'All bins fetched successfully',
      bins
    })
  } catch (error) {
    next(error)
  }
}
