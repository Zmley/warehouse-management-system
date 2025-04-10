import { Request, Response, NextFunction } from 'express'
import {
  createTaskAsAdmin,
  acceptTaskByTaskID,
  createTaskAsPicker,
  getTasksByWarehouseID,
  cancelTaskByID,
  getTaskByAccountID,
  cancelPickerTaskByAccountID,
  getTasksByWarehouseIDAdmin
} from '../tasks/task.service'
import { getBinByBinCode } from 'routes/bins/bin.service'

export const createAsAdmin = async (req: Request, res: Response) => {
  try {
    const { sourceBinCode, destinationBinCode, productCode } = req.body
    const accountID = res.locals.currentAccount.accountID
    const warehouseID = res.locals.currentAccount.warehouseID

    const sourceBin = await getBinByBinCode(sourceBinCode, warehouseID)
    const destinationBin = await getBinByBinCode(
      destinationBinCode,
      warehouseID
    )

    const task = await createTaskAsAdmin(
      sourceBin.binID,
      destinationBin.binID,
      productCode,
      accountID
    )

    res.status(201).json(task)
  } catch (error) {
    console.error('❌ Error creating task as admin:', error)
    res.status(500).json({ message: error.message })
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

    const task = await acceptTaskByTaskID(accountID, taskID)

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
    const { warehouseID, role } = res.locals

    const tasksWithBinCodes = await getTasksByWarehouseID(warehouseID, role)

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

export const cancelPickerTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskID } = req.params
    const { accountID } = res.locals
    const task = await cancelPickerTaskByAccountID(accountID, taskID)
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
    const { accountID, warehouseID, role } = res.locals
    const tasks = await getTasksByWarehouseID(warehouseID, role, accountID)
    res.status(200).json({ tasks })
  } catch (error) {
    next(error)
  }
}

export const getAllTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { warehouseID } = res.locals

    const tasksWithBinCodes = await getTasksByWarehouseIDAdmin(warehouseID)

    res.status(200).json({
      message: 'Successfully fetched all pending tasks for Picker',
      tasks: tasksWithBinCodes
    })
  } catch (error) {
    next(error)
  }
}
