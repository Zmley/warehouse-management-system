import { Request, Response, NextFunction } from 'express'
import {
  createTask,
  acceptTaskService,
  createPickerTaskService
} from '../tasks/task.service'
import AppError from '../../utils/appError'

export const createAsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sourceBinID, destinationBinID, productCode } = req.body
    const accountID = res.locals.accountID

    const task = await createTask(
      sourceBinID,
      destinationBinID,
      productCode,
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

export const createAsPicker = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { binID, productCode } = req.body
    const { accountID, warehouseID } = res.locals

    const task = await createPickerTaskService(
      binID,
      accountID,
      warehouseID,
      productCode
    )

    res.status(201).json({
      message: `Picker Task created successfully`,
      task
    })
  } catch (error) {
    next(error)
  }
}
