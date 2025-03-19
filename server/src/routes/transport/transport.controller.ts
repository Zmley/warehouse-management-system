import { Request, Response, NextFunction } from 'express'
import * as cargoService from './transport.service'
import { hasActiveTask } from '../tasks/task.service'
import AppError from '../../utils/appError'

export const loadCargo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accountID = res.locals.accountID
    const { binID } = req.body

    if (!binID) {
      return next(new AppError(400, '❌ Missing binID'))
    }

    if (!accountID) {
      return next(new AppError(400, '❌ Missing accountId'))
    }

    const hasTask = await hasActiveTask(accountID)
    if (hasTask) {
      return next(new AppError(400, '❌ You already have an active task!'))
    }

    const result = await cargoService.loadCargo(binID, accountID)

    res.status(result.status).json({ message: result.message })
  } catch (error) {
    next(error)
  }
}
