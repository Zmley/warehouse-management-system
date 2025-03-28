import { Request, Response, NextFunction } from 'express'
import { getBinByBinCode } from './bin.service'
import { getBinCodesByProductCodeAndWarehouse } from '../bins/bin.service'

export const getBinByCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { warehouseID } = res.locals

    const { binCode } = req.body

    const bin = await getBinByBinCode(binCode, warehouseID)

    res.status(200).json({
      message: 'Bin fetched successfully',
      bin: bin
    })
  } catch (error) {
    next(error)
  }
}

export const getMatchBinCodesByProductCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productCode } = req.body
    const { warehouseID } = res.locals

    const binCodes = await getBinCodesByProductCodeAndWarehouse(
      productCode,
      warehouseID
    )

    res.status(200).json({
      message: 'Bin codes fetched successfully',
      binCodes
    })
  } catch (error) {
    next(error)
  }
}
