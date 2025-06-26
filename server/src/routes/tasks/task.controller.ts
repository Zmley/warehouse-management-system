import { Request, Response, NextFunction } from 'express'
import * as taskService from 'routes/tasks/task.service'
import * as binService from 'routes/bins/bin.service'
import { UserRole } from 'constants/uerRole'
import { TaskStatus } from 'constants/tasksStatus'
import { updateTaskService } from 'routes/tasks/task.service'

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

// export const createTask = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { accountID } = res.locals
//     const {
//       productCode,
//       sourceBinCode,
//       destinationBinCode,
//       quantity,
//       warehouseID
//     } = req.body.payload

//     if (!sourceBinCode) {
//       const destinationBin = await checkIfPickerTaskPublished(
//         productCode,
//         destinationBinCode
//       )

//       const task = await taskService.binsToPick(
//         destinationBin.binCode,
//         accountID,
//         warehouseID,
//         productCode,
//         quantity
//       )

//       return res.status(201).json({
//         success: true,
//         message: '✅ Task created using destination bin from productCode',
//         task
//       })
//     }

//     const sourceBin = await binService.getBinByBinCode(sourceBinCode)
//     const destinationBin = await binService.getBinByBinCode(destinationBinCode)

//     const task = await taskService.binToBin(
//       sourceBin.binID,
//       destinationBin.binID,
//       productCode,
//       accountID,
//       quantity
//     )

//     return res.status(200).json({
//       success: true,
//       message: '✅ Task created successfully',
//       task
//     })
//   } catch (error) {
//     next(error)
//   }
// }

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

    // ✅ 统一先检查是否重复
    await taskService.checkIfTaskDuplicate(
      productCode,
      destinationBinCode,
      sourceBinCode
    )

    // ✅ binsToPick 模式（没有指定 sourceBinCode）
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

    // ✅ binToBin 模式
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

  try {
    if (!status || !sourceBinCode) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const updatedTask = await updateTaskService(taskID, status, sourceBinCode)
    res.json({ success: true, task: updatedTask })
  } catch (error) {
    console.error('❌ Failed to update task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
