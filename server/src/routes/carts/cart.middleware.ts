import { Request, Response, NextFunction } from 'express'
import AppError from 'utils/appError'

export const validateLoad = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { productCode, binCode, quantity } = req.body

  if (!productCode && !binCode) {
    return next(new AppError(400, '❌ Missing productCode or binCode'))
  }

  if (productCode && (quantity === undefined || quantity === null)) {
    return next(
      new AppError(400, '❌ Missing quantity for productCode loading')
    )
  }

  next()
}

export const validateUnload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { binCode, unloadProductList } = req.body

  if (!binCode || typeof binCode !== 'string') {
    throw new AppError(400, '❌ binCode is required and must be a string')
  }

  if (!Array.isArray(unloadProductList) || unloadProductList.length === 0) {
    throw new AppError(400, '❌ unloadProductList must be a non-empty array')
  }

  for (const item of unloadProductList) {
    if (!item.inventoryID || typeof item.inventoryID !== 'string') {
      throw new AppError(400, '❌ Each item must have a valid inventoryID')
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      throw new AppError(400, '❌ Each item must have a valid quantity')
    }
  }

  next()
}
