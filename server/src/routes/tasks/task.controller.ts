import { Request, Response, NextFunction } from 'express'
import {
  createTaskAsAdmin,
  acceptTaskService,
  createTaskAsPicker,
  getPendingTasksService,
  getInProcessTaskWithBinCodes,
  cancelTaskByID,
  getPickerCreatedTasksService,
  cancelPickerTaskService
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

    const task = await createTaskAsAdmin(
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
    const { binCode, productCode } = req.body
    const { accountID, warehouseID } = res.locals

    const task = await createTaskAsPicker(
      binCode,
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

////////////////////////////////

export const getPendingTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const warehouseID = res.locals.warehouseID

    const tasksWithBinCodes = await getPendingTasksService(warehouseID)

    res.status(200).json({
      message: 'Successfully fetched all pending tasks for Picker',
      tasks: tasksWithBinCodes
    })
  } catch (error) {
    next(error)
  }
}

export const getCurrentInProcessTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountID, warehouseID } = res.locals

    const task = await getInProcessTaskWithBinCodes(accountID, warehouseID)

    res.status(200).json({
      message: 'Successfully fetched current in-process task',
      task: task
    })
  } catch (error) {
    next(error)
  }
}

export const cancelTaskByTaskID = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskID } = req.body

    if (!taskID) {
      return res.status(400).json({ message: '❌ taskID is required' })
    }

    const task = await cancelTaskByID(taskID)

    res.status(200).json({
      message: `Task "${task.taskID}" cancelled successfully`,
      task
    })
  } catch (error) {
    next(error)
  }
}

/////////////////////////////////////////////////////

export const getPickerCreatedTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountID } = res.locals
    const tasks = await getPickerCreatedTasksService(accountID)
    res.status(200).json({ tasks })
  } catch (error) {
    next(error)
  }
}

export const cancelPickerTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskID } = req.body
    const { accountID } = res.locals
    const task = await cancelPickerTaskService(accountID, taskID)
    res.status(200).json({ message: 'Task cancelled', task })
  } catch (error) {
    next(error)
  }
}
