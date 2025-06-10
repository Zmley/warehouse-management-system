import { Request, Response, NextFunction } from 'express'
import AppError from 'utils/appError'

export const validateAddInventories = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const inventories = req.body

  if (!Array.isArray(inventories)) {
    return next(new AppError(400, 'Invalid payload: must be an array'))
  }

  next()
}

export const validateUpdateInventory = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { inventoryID } = req.params
  const updates = req.body

  if (!inventoryID) {
    return next(new AppError(400, 'Missing inventoryID in params'))
  }

  if (!updates || typeof updates !== 'object') {
    return next(new AppError(400, 'Missing update data'))
  }

  const allowedFields = ['productCode', 'quantity', 'binID', 'remark']
  const keys = Object.keys(updates)

  if (keys.length === 0) {
    return next(new AppError(400, 'No fields provided to update'))
  }

  for (const key of keys) {
    if (!allowedFields.includes(key)) {
      return next(new AppError(400, `Invalid field "${key}" in update`))
    }
  }

  next()
}

export const validateDeleteInventory = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { inventoryID } = req.params

  if (!inventoryID || typeof inventoryID !== 'string') {
    return next(new AppError(400, 'Missing or invalid inventoryID in params'))
  }

  next()
}

export const validateGetInventories = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { warehouseID } = req.query

  if (!warehouseID || typeof warehouseID !== 'string') {
    return next(new AppError(400, 'Missing or invalid warehouseID'))
  }

  next()
}
