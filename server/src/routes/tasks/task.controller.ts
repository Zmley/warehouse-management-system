import { Request, Response, NextFunction } from 'express'
import * as taskService from '../tasks/task.service'
import * as binService from 'routes/bins/bin.service'
export const createAsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sourceBinCode, destinationBinCode, productCode } = req.body
    const accountID = res.locals.currentAccount.accountID
    const warehouseID = res.locals.currentAccount.warehouseID

    const sourceBin = await binService.getBinByBinCode(
      sourceBinCode,
      warehouseID
    )
    const destinationBin = await binService.getBinByBinCode(
      destinationBinCode,
      warehouseID
    )

    const task = await taskService.createAsAdmin(
      sourceBin.binID,
      destinationBin.binID,
      productCode,
      accountID
    )

    res.status(200).json(task)
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

    const task = await taskService.acceptTaskByTaskID(accountID, taskID)

    res.status(200).json({
      message: 'Task accepted successfully and is now in progress',
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

    const tasksWithBinCodes = await taskService.getTasksByWarehouseID(
      warehouseID,
      role
    )

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

    const task = await taskService.getTaskByAccountID(accountID, warehouseID)

    res.status(200).json({
      message: 'Successfully fetched current in-process task',
      task
    })
  } catch (error) {
    next(error)
  }
}

export const cancelByWoker = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskID } = req.params
    const { role, accountID } = res.locals

    const task = await taskService.cancelBytaskID(taskID, accountID, role)

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

    const task = await taskService.createTaskAsPicker(
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

export const cancelByPicker = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskID } = req.params
    const { role, accountID } = res.locals
    const task = await taskService.cancelBytaskID(taskID, accountID, role)
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
    const tasks = await taskService.getTasksByWarehouseID(
      warehouseID,
      role,
      accountID
    )
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
    const { accountID, warehouseID, role } = res.locals

    const tasksWithBinCodes = await taskService.getTasksByWarehouseID(
      warehouseID,
      role,
      accountID
    )

    res.status(200).json({
      message: 'Successfully fetched all pending tasks for Picker',
      tasks: tasksWithBinCodes
    })
  } catch (error) {
    next(error)
  }
}

export const cancelByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskID } = req.params
    const { role, accountID } = res.locals

    const task = await taskService.cancelBytaskID(taskID, accountID, role)

    res.status(200).json({
      message: `Task "${task.taskID}" cancelled successfully`,
      task
    })
  } catch (error) {
    next(error)
  }
}
