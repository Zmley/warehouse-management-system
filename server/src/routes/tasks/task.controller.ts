import { Request, Response, NextFunction } from 'express'
import {
  createTaskAsAdmin,
  acceptTaskService,
  createTaskAsPicker,
  getTasksByWarehouseID,
  cancelTaskByID,
  getTaskByAccountID,
  getTasksByAccountID,
  cancelPickerTaskService
} from '../tasks/task.service'

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
    const { taskID } = req.params

    const task = await acceptTaskService(accountID, taskID)

    res.status(200).json({
      message: `Task accepted successfully and is now in progress`,
      task
    })
  } catch (error) {
    next(error)
  }
}

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const warehouseID = res.locals.warehouseID

    const tasksWithBinCodes = await getTasksByWarehouseID(warehouseID)

    res.status(200).json({
      message: 'Successfully fetched all pending tasks for Picker',
      tasks: tasksWithBinCodes
    })
  } catch (error) {
    next(error)
  }
}

export const getMyTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accountID, warehouseID } = res.locals

    const task = await getTaskByAccountID(accountID, warehouseID)

    res.status(200).json({
      message: 'Successfully fetched current in-process task',
      task: task
    })
  } catch (error) {
    next(error)
  }
}

export const cancelTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskID } = req.params

    const task = await cancelTaskByID(taskID)

    res.status(200).json({
      message: `Task "${task.taskID}" cancelled successfully`,
      task
    })
  } catch (error) {
    next(error)
  }
}

///////////////////////////////////////////////

export const createAsPicker = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { binID, productCode } = req.body
    const { accountID, warehouseID } = res.locals

    const task = await createTaskAsPicker(
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

export const cancelPickerTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskID } = req.params
    const { accountID } = res.locals
    const task = await cancelPickerTaskService(accountID, taskID)
    res.status(200).json({ message: 'Task cancelled', task })
  } catch (error) {
    next(error)
  }
}

export const getPickerCreatedTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountID, warehouseID } = res.locals
    const tasks = await getTasksByAccountID(accountID, warehouseID)
    res.status(200).json({ tasks })
  } catch (error) {
    next(error)
  }
}
