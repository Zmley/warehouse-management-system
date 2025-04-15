import { Request, Response, NextFunction } from 'express'
import * as taskService from '../tasks/task.service'
import * as binService from 'routes/bins/bin.service'
import AppError from 'utils/appError'

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

export const cancelTaskByRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskID } = req.params
    const { role, accountID } = res.locals

    if (!taskID || !role || !accountID) {
      throw new AppError(400, 'Missing required parameters')
    }

    const task = await taskService.cancelBytaskID(taskID, accountID, role)

    res.status(200).json({
      message: `Task "${task.taskID}" cancelled successfully by ${role}`,
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

export const getTasksByRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, accountID, warehouseID: localWarehouseID } = res.locals
    const queryWarehouseID = req.query.warehouseID

    let warehouseID: string | undefined

    if (role === 'ADMIN') {
      if (!queryWarehouseID || typeof queryWarehouseID !== 'string') {
        res
          .status(400)
          .json({ message: 'Missing or invalid warehouseID in query.' })
        return
      }
      warehouseID = queryWarehouseID
    } else {
      warehouseID = localWarehouseID
    }

    const tasksWithBinCodes = await taskService.getTasksByWarehouseID(
      warehouseID,
      role,
      accountID
    )

    res.status(200).json({
      message: '✅ Successfully fetched tasks.',
      tasks: tasksWithBinCodes
    })
  } catch (error) {
    next(error)
  }
}
