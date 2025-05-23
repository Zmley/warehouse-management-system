import { Request, Response, NextFunction } from 'express'
import * as taskService from 'routes/tasks/task.service'
import * as binService from 'routes/bins/bin.service'
import AppError from 'utils/appError'
import { UserRole } from 'constants/uerRole'
import { TaskStatus } from 'constants/tasksStatus'
import { getPickBinByProductCode } from 'routes/bins/bin.service'
import { checkIfPickerTaskPublished } from 'routes/tasks/task.service'

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
      success: true,
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
      success: true,
      message: 'Successfully fetched current in-process task',
      task
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
    const { role, accountID } = res.locals

    if (!taskID || !role || !accountID) {
      throw new AppError(400, 'Missing required parameters')
    }

    const task = await taskService.cancelBytaskID(taskID, accountID, role)

    res.status(200).json({
      success: true,
      message: `Task "${task.taskID}" cancelled successfully by ${role}`,
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
    const { role, accountID, warehouseID: localWarehouseID } = res.locals
    const queryWarehouseID = req.query.warehouseID
    const { keyword, status: rawStatus } = req.query

    let warehouseID: string
    let status: string | undefined = undefined

    if (role === UserRole.ADMIN) {
      if (typeof queryWarehouseID !== 'string') {
        return
      }
      warehouseID = queryWarehouseID
      if (typeof rawStatus === 'string') {
        status = rawStatus
      }
    } else if (role === UserRole.PICKER) {
      warehouseID = localWarehouseID
      //temporary using ALL
      status = 'ALL'
    } else if (role === UserRole.TRANSPORT_WORKER) {
      warehouseID = localWarehouseID
      status = TaskStatus.PENDING
    }

    const tasksWithBinCodes = await taskService.getTasksByWarehouseID(
      warehouseID,
      role,
      accountID,
      typeof keyword === 'string' ? keyword : undefined,
      status
    )

    res.status(200).json({
      success: true,
      message: '✅ Successfully fetched tasks.',
      tasks: tasksWithBinCodes
    })
  } catch (error) {
    next(error)
  }
}

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountID } = res.locals
    const {
      productCode,
      sourceBinCode,
      destinationBinCode,
      quantity,
      warehouseID
    } = req.body

    if (!sourceBinCode) {
      await checkIfPickerTaskPublished(
        warehouseID,
        productCode,
        destinationBinCode
      )

      const destinationBin = await getPickBinByProductCode(
        productCode,
        warehouseID
      )
      const task = await taskService.binsToPick(
        destinationBin.binCode,
        accountID,
        warehouseID,
        productCode,
        quantity
      )

      return res.status(201).json({
        success: true,
        message: '✅ Task created using destination bin from productCode',
        task
      })
    }

    const sourceBin = await binService.getBinByBinCode(sourceBinCode)
    const destinationBin = await binService.getBinByBinCode(destinationBinCode)

    const task = await taskService.binToBin(
      sourceBin.binID,
      destinationBin.binID,
      productCode,
      accountID,
      quantity
    )

    return res.status(200).json({
      success: true,
      message: '✅ Task created successfully',
      task
    })
  } catch (error) {
    next(error)
  }
}

export const releaseTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskID } = req.params
    const { accountID, cartID } = res.locals

    const releasedTask = await taskService.releaseTask(
      taskID,
      accountID,
      cartID
    )

    res.status(200).json({
      success: true,
      message: '✅ Task released successfully',
      task: releasedTask
    })
  } catch (error) {
    next(error)
  }
}
