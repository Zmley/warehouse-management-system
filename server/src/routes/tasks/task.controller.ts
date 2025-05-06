import { Request, Response, NextFunction } from 'express'
import * as taskService from 'routes/tasks/task.service'
import * as binService from 'routes/bins/bin.service'
import AppError from 'utils/appError'
import { UserRole } from 'constants/uerRole'
import { TaskStatus } from 'constants/tasksStatus'
import { getBinByProductCode } from 'routes/bins/bin.service'

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
    const { role, accountID, warehouseID } = res.locals
    const {
      productCode,
      binCode,
      sourceBinCode,
      destinationBinCode,
      quantity
    } = req.body

    if (role === UserRole.ADMIN) {
      if (!sourceBinCode) {
        const destinationBin = await getBinByProductCode(
          productCode,
          warehouseID
        )

        const task = await taskService.createTaskAsPicker(
          binCode || destinationBin[0]?.binCode,
          accountID,
          warehouseID,
          productCode,
          quantity
        )

        return res.status(201).json({
          success: true,
          message: '✅ Admin created Picker-style task successfully',
          task
        })
      }

      const sourceBin = await binService.getBinByBinCode(sourceBinCode)
      const destinationBin = await binService.getBinByBinCode(
        destinationBinCode
      )

      const task = await taskService.createAsAdmin(
        sourceBin.binID,
        destinationBin.binID,
        productCode,
        accountID,
        quantity
      )

      return res.status(200).json({
        success: true,
        message: '✅ Admin task created successfully',
        task
      })
    }

    if (role === UserRole.PICKER) {
      const task = await taskService.createTaskAsPicker(
        binCode,
        accountID,
        warehouseID,
        productCode,
        quantity
      )

      return res.status(201).json({
        success: true,
        message: '✅ Picker task created successfully',
        task
      })
    }

    throw new AppError(403, '❌ Unauthorized role')
  } catch (error) {
    next(error)
  }
}
