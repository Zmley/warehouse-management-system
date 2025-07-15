import { Request, Response, NextFunction } from 'express'
import { UserRole, TaskStatus } from 'constants/index'
import * as taskService from 'routes/tasks/task.service'
import * as binService from 'routes/bins/bin.service'
import * as inventoryService from 'routes/inventory/inventory.service'
import * as cartsService from 'routes/carts/cart.service'

import Task from './task.model'
import AppError from 'utils/appError'
import Bin from 'routes/bins/bin.model'

export const acceptTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accountID = res.locals.accountID
    const { taskID } = req.params

    await taskService.validateTaskAcceptance(accountID, taskID)

    const task = await taskService.updateTaskByTaskID({
      taskID,
      status: TaskStatus.IN_PROCESS,
      accepterID: accountID
    })

    res.status(200).json({
      success: true,
      message: '✅ Task accepted successfully and is now in progress',
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
    const { role, cartID } = res.locals

    let task

    if (role === UserRole.ADMIN || role === UserRole.PICKER) {
      task = await taskService.updateTaskByTaskID({
        taskID,
        status: TaskStatus.CANCELED
      })
    } else if (role === UserRole.TRANSPORT_WORKER) {
      const currentTask = await Task.findByPk(taskID)

      if (currentTask.status !== TaskStatus.IN_PROCESS) {
        throw new AppError(400, '❌ Only in-process tasks can be cancelled')
      }

      const cartInventories = await inventoryService.getCartInventories(cartID)

      console.log(
        `Auto-unloading item(s) back to bin: ${cartInventories.length}`
      )

      if (cartInventories.length > 0) {
        const unloadProductList = cartInventories.map(item => ({
          inventoryID: item.inventoryID,
          quantity: item.quantity
        }))

        const sourceBin = await Bin.findByPk(currentTask.sourceBinID)

        console.log(
          `🚚 Auto-unloading ${unloadProductList.length} item(s) back to bin ${sourceBin.binCode}`
        )

        await cartsService.unloadByBinCode(sourceBin.binCode, unloadProductList)
      }

      task = await taskService.updateTaskByTaskID({
        taskID,
        status: TaskStatus.PENDING,
        accepterID: null
      })
    } else {
      throw new AppError(403, '❌ Role not authorized to cancel tasks')
    }

    res.status(200).json({
      success: true,
      message: `Task "${task.taskID}" cancelled successfully`,
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

    const queryWarehouseID = req.query.warehouseID as string | undefined
    const { keyword, status: rawStatus } = req.query

    let warehouseID: string
    let status: string | undefined = undefined

    if (role === UserRole.ADMIN) {
      warehouseID = queryWarehouseID as string

      if (typeof rawStatus === 'string') {
        status = rawStatus
      }
    } else if (role === UserRole.PICKER) {
      warehouseID = localWarehouseID
      status = 'ALL'
    } else if (role === UserRole.TRANSPORT_WORKER) {
      warehouseID = localWarehouseID
      status = TaskStatus.PENDING
    } else {
      res.status(403).json({
        success: false,
        message: '❌ Unauthorized role'
      })
      return
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
    } = req.body.payload

    await taskService.checkIfTaskDuplicate(
      productCode,
      destinationBinCode,
      sourceBinCode
    )

    if (!sourceBinCode) {
      const destinationBin = await binService.getBinByBinCode(
        destinationBinCode
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

export const updateTask = async (req: Request, res: Response) => {
  const { taskID } = req.params
  const { status, sourceBinCode } = req.body
  const { accountID } = res.locals

  try {
    const existingTask = await Task.findByPk(taskID)

    const originalStatus = existingTask.status

    let updatedTask

    const isVirtualBin =
      sourceBinCode === 'Transfer-in' || sourceBinCode === 'Out of Stock'

    if (
      originalStatus === TaskStatus.PENDING &&
      status === TaskStatus.COMPLETED &&
      !isVirtualBin
    ) {
      updatedTask = await taskService.completeTaskByAdmin(
        taskID,
        sourceBinCode,
        accountID
      )
    } else {
      updatedTask = await taskService.updateTaskByTaskID({
        taskID,
        status,
        sourceBinCode
      })
    }

    return res.json({ success: true, task: updatedTask })
  } catch (error) {
    console.error('❌ Failed to update task:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
