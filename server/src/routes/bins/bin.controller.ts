import { Request, Response, NextFunction } from 'express'
import { getBinByBinCode } from './bin.service'

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
