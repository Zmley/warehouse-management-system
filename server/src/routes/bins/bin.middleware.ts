import { Request, Response, NextFunction } from 'express'
import AppError from 'utils/appError'

export const validateProductCodeAndWarehouseID = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { productCode } = req.params
  const { warehouseID } = res.locals

  if (!productCode || !warehouseID) {
    throw new AppError(400, '❌ Missing productCode or warehouseID')
  }

  next()
}

export const validateBinCodeParam = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { binCode } = req.params
  if (!binCode) {
    throw new AppError(400, '❌ Missing binCode')
  }
  next()
}

export const validateUpdateDefaultProductCodes = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { binID } = req.params
  const { defaultProductCodes } = req.body

  if (!binID) {
    throw new AppError(400, '❌ binID is required')
  }

  if (defaultProductCodes === undefined) {
    throw new AppError(400, '❌ defaultProductCodes is required')
  }

  next()
}

export const validateWarehouseIDQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { warehouseID } = req.query
  if (!warehouseID || typeof warehouseID !== 'string') {
    throw new AppError(400, '❌ warehouseID is required')
  }
  next()
}
