import { Request, Response, NextFunction } from 'express'
import AppError from 'utils/appError'

export const validateGetProducts = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { warehouseID, page, limit } = req.query

  if (!warehouseID || typeof warehouseID !== 'string') {
    return next(new AppError(400, 'Missing or invalid warehouseID'))
  }

  if (page && isNaN(Number(page))) {
    return next(new AppError(400, 'Invalid page number'))
  }

  if (limit && isNaN(Number(limit))) {
    return next(new AppError(400, 'Invalid limit number'))
  }

  next()
}

export const validateGetProduct = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { barCode } = req.query
  if (!barCode || typeof barCode !== 'string') {
    return next(new AppError(400, 'Missing or invalid barCode'))
  }
  next()
}

export const validateAddProducts = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const products = req.body

  if (!Array.isArray(products)) {
    return next(new AppError(400, 'Payload must be an array of products'))
  }

  next()
}
