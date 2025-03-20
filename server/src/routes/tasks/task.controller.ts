import { Request, Response, NextFunction } from 'express'
import {
  createTask,
  acceptTaskService,
  sourceBinInTask
} from '../tasks/task.service'
import AppError from '../../utils/appError'

export const createTaskByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sourceBinID, destinationBinID, productList } = req.body
    const accountID = res.locals.accountID

    const task = await createTask(
      sourceBinID,
      destinationBinID,
      productList,
      accountID
    )

    res.status(201).json({
      message: `Task created successfully`,
      task
    })
  } catch (error) {
    next(error)
  }
}

export const acceptTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accountID = res.locals.accountID
    const { taskID } = req.body

    const task = await acceptTaskService(accountID, taskID)

    res.status(200).json({
      message: `Task accepted successfully and is now in progress`,
      task
    })
  } catch (error) {
    next(error)
  }
}

export const checkBinAvailable = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sourceBinID } = req.body

    if (!sourceBinID || typeof sourceBinID !== 'string') {
      return next(new AppError(400, 'Invalid sourceBinID'))
    }

    const existingTask = await sourceBinInTask(sourceBinID)

    if (existingTask) {
      return next(new AppError(409, '⚠️ Task already exists for this bin'))
    }

    res.status(200).json({ message: 'Bin is available for new tasks' })
  } catch (error) {
    console.error(
      `Error checking bin availability for ${req.body.sourceBinID}:`,
      error
    )
    next(new AppError(500, 'Internal Server Error'))
  }
}
