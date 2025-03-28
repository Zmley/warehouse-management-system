import { Request, Response, NextFunction } from 'express'
import { getAllProductCodesService } from './product.service'

export const getAllProductCodes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productCodes = await getAllProductCodesService()
    res.status(200).json({ productCodes })
  } catch (error) {
    next(error)
  }
}
