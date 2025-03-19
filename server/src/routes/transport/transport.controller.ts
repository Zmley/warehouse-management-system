import { Request, Response, NextFunction } from 'express'
import { loadCargoHelper } from './transport.service'
import { hasActiveTask } from '../tasks/task.service'
import AppError from '../../utils/appError'

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
