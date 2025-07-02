import { Request, Response, NextFunction } from 'express'
import * as taskService from 'routes/tasks/task.service'
import * as binService from 'routes/bins/bin.service'
import { UserRole } from 'constants/uerRole'
import { TaskStatus } from 'constants/tasksStatus'
import {
  completeTaskByAdmin,
  updateTaskByTaskID,
  validateTaskAcceptance
} from 'routes/tasks/task.service'
import Task from './task.model'
import AppError from 'utils/appError'
// import AppError from 'utils/appError'

export const acceptTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accountID = res.locals.accountID
    const { taskID } = req.params

    // Step 1: Validate whether the task can be accepted
    await validateTaskAcceptance(accountID, taskID)

    // Step 2: Update the task status to IN_PROCESS and assign accepterID
    const task = await updateTaskByTaskID({
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

// export const cancelTask = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { taskID } = req.params
//     const { role, accountID } = res.locals

//     const task = await taskService.cancelBytaskID(taskID, accountID, role)

//     res.status(200).json({
//       success: true,
//       message: `Task "${task.taskID}" cancelled successfully by ${role}`,
//       task
//     })
//   } catch (error) {
//     next(error)
//   }
// }

export const cancelTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskID } = req.params
    const { role } = res.locals

    let task

    if (role === UserRole.ADMIN || role === UserRole.PICKER) {
      task = await updateTaskByTaskID({ taskID, status: TaskStatus.CANCELED })

      // if (role === UserRole.PICKER) {
      //   const currentTask = await Task.findByPk(taskID)
      //   if (currentTask?.creatorID !== accountID) {
      //     throw new AppError(403, '❌ Picker does not own this task')
      //   }
      // }
    } else if (role === UserRole.TRANSPORT_WORKER) {
      const currentTask = await Task.findByPk(taskID)
      // if (!currentTask) throw new AppError(404, '❌ Task not found')

      if (currentTask.status !== TaskStatus.IN_PROCESS) {
        throw new AppError(400, '❌ Only in-process tasks can be cancelled')
      }

      task = await updateTaskByTaskID({
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
    const queryWarehouseID = req.query.warehouseID
    const { keyword, status: rawStatus } = req.query

    let warehouseID: string
    let status: string | undefined = undefined

    if (role === UserRole.ADMIN) {
      if (typeof queryWarehouseID !== 'string') {
        res.status(400).json({
          success: false,
          message: '❌ Admin must provide a valid warehouseID in query params.'
        })
        return
      }
      warehouseID = queryWarehouseID

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
      originalStatus === 'PENDING' &&
      status === 'COMPLETED' &&
      !isVirtualBin
    ) {
      updatedTask = await completeTaskByAdmin(taskID, sourceBinCode, accountID)
    } else {
      updatedTask = await updateTaskByTaskID({ taskID, status, sourceBinCode })
    }

    return res.json({ success: true, task: updatedTask })
  } catch (error) {
    console.error('❌ Failed to update task:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
