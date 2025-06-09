import { Request, Response, NextFunction } from 'express'
import AppError from 'utils/appError'

export const validateAcceptTask = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { taskID } = req.params
  const { accountID } = res.locals

  if (!taskID || !accountID) {
    return next(new AppError(400, 'Missing taskID or accountID'))
  }

  next()
}

export const validateCancelTask = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { taskID } = req.params
  const { role, accountID } = res.locals

  if (!taskID || !role || !accountID) {
    return next(new AppError(400, 'Missing taskID, role or accountID'))
  }

  next()
}

export const validateCreateTask = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { accountID } = res.locals
  const { productCode, destinationBinCode, warehouseID } =
    req.body.payload || req.body

  if (!accountID || !productCode || !destinationBinCode || !warehouseID) {
    return next(
      new AppError(400, 'Missing required fields for creating a task')
    )
  }

  next()
}

export const validateGetMyTask = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { accountID, warehouseID } = res.locals

  if (!accountID || !warehouseID) {
    return next(new AppError(400, 'Missing accountID or warehouseID'))
  }

  next()
}

export const validateGetTasks = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { role, accountID, warehouseID } = res.locals
  const { warehouseID: queryWarehouseID } = req.query

  if (!role || !accountID) {
    return next(new AppError(400, 'Missing role or accountID'))
  }

  if (role === 'ADMIN' && typeof queryWarehouseID !== 'string') {
    return next(
      new AppError(400, 'Admin must provide a valid warehouseID in query')
    )
  }

  if ((role === 'PICKER' || role === 'TRANSPORT_WORKER') && !warehouseID) {
    return next(new AppError(400, 'Missing warehouseID for non-admin user'))
  }

  next()
}

export const validateReleaseTask = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { taskID } = req.params
  const { accountID, cartID, warehouseID } = res.locals

  if (!taskID || !accountID || !cartID || !warehouseID) {
    return next(
      new AppError(
        400,
        'Missing required parameters: taskID, accountID, cartID, warehouseID'
      )
    )
  }

  next()
}

export const validateUpdateTask = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { status, sourceBinCode } = req.body
  const { taskID } = req.params

  if (!taskID || !status || !sourceBinCode) {
    return next(new AppError(400, 'Missing taskID, status, or sourceBinCode'))
  }

  next()
}
