import { Request, Response, NextFunction } from 'express'
import { loadCargoHelper, unloadCargoHelper } from './transport.service'
import { hasActiveTask } from '../tasks/task.service'
import AppError from '../../utils/appError'
import { updateTaskStatus } from '../tasks/task.service'

export const loadCargo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accountID = res.locals.accountID
    const role = res.locals.role
    const cartID = res.locals.cartID
    const { binID } = req.body

    if (role !== 'TRANSPORT_WORKER') {
      return next(new AppError(403, '❌ Only transport workers can use a car'))
    }

    const hasTask = await hasActiveTask(accountID)
    if (hasTask) {
      return next(new AppError(400, '❌ You already have an active task!'))
    }

    const result = await loadCargoHelper(binID, accountID, cartID)

    res.status(result.status).json({ message: result.message })
  } catch (error) {
    next(error)
  }
}

export const unloadCargo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accountID = res.locals.accountID
    const cartID = res.locals.cartID
    const { unLoadBinID, productList } = req.body

    if (!unLoadBinID) {
      return next(new AppError(400, '❌ Missing unLoadBinID'))
    }

    if (!Array.isArray(productList) || productList.length === 0) {
      return next(
        new AppError(400, '❌ Product list is required for unloading')
      )
    }

    const updatedCount = await unloadCargoHelper(
      unLoadBinID,
      cartID,
      productList
    )

    if (updatedCount === 0) {
      return next(new AppError(404, '❌ No matching products found to update'))
    }

    await updateTaskStatus(accountID, unLoadBinID, cartID)

    res.status(200).json({
      message: `✅ Cargo successfully unloaded into ${unLoadBinID}.`,
      updatedProducts: updatedCount
    })
  } catch (error) {
    next(error)
  }
}
