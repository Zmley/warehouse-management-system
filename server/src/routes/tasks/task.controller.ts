import httpStatus from 'http-status'
import { UserRole, TaskStatus } from 'constants/index'
import * as taskService from 'routes/tasks/task.service'
import * as binService from 'routes/bins/bin.service'
import Task from './task.model'
import AppError from 'utils/appError'
import { asyncHandler } from 'utils/asyncHandler'
import { getAdminTasksByWarehouseID } from 'routes/tasks/task.service'

export const acceptTask = asyncHandler(async (req, res) => {
  const { accountID, cartID } = res.locals
  const { taskID } = req.params

  await taskService.validateTaskAcceptance(accountID, taskID, cartID)

  const task = await taskService.updateTaskByTaskID({
    taskID,
    status: TaskStatus.IN_PROCESS,
    accepterID: accountID
  })

  res.status(httpStatus.OK).json({ success: true, task })
})

export const getMyTask = asyncHandler(async (req, res) => {
  const { accountID, warehouseID } = res.locals
  const task = await taskService.getTaskByAccountID(accountID, warehouseID)
  res.status(httpStatus.OK).json({
    success: true,
    task
  })
})

export const cancelTask = asyncHandler(async (req, res) => {
  const { taskID } = req.params
  const { role, cartID } = res.locals

  let task: Task | null = null

  if (role === UserRole.ADMIN) {
    task = await taskService.updateTaskByTaskID({
      taskID,
      status: TaskStatus.CANCELED
    })
  } else if (role === UserRole.TRANSPORT_WORKER) {
    task = await taskService.cancelByTransportWorker(taskID, cartID)
  } else {
    throw new AppError(httpStatus.FORBIDDEN, 'ROLE_FORBIDDEN', 'ROLE_FORBIDDEN')
  }

  res.status(httpStatus.OK).json({ success: true, task })
})

// export const getTasks = asyncHandler(async (req, res) => {
//   const { role, accountID, warehouseID: localWarehouseID } = res.locals
//   const queryWarehouseID = req.query.warehouseID as string | undefined
//   const { keyword, status: rawStatus } = req.query

//   let warehouseID: string
//   let status: string | undefined = undefined

//   if (role === UserRole.ADMIN) {
//     if (typeof queryWarehouseID !== 'string' || !queryWarehouseID) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         'Admin must provide a valid warehouseID in query',
//         'WAREHOUSE_ID_REQUIRED'
//       )
//     }
//     warehouseID = queryWarehouseID
//     if (typeof rawStatus === 'string') status = rawStatus
//   } else if (role === UserRole.PICKER) {
//     warehouseID = localWarehouseID
//     status = 'ALL'
//   } else if (role === UserRole.TRANSPORT_WORKER) {
//     warehouseID = localWarehouseID
//     status = TaskStatus.PENDING
//   } else {
//     throw new AppError(
//       httpStatus.FORBIDDEN,
//       '❌ Unauthorized role',
//       'ROLE_FORBIDDEN'
//     )
//   }

//   const tasksWithBinCodes = await taskService.getTasksByWarehouseID(
//     warehouseID,
//     role,
//     accountID,
//     typeof keyword === 'string' ? keyword : undefined,
//     status
//   )

//   res.status(httpStatus.OK).json({
//     success: true,
//     tasks: tasksWithBinCodes
//   })
// })

export const getTasks = asyncHandler(async (req, res) => {
  const { role, accountID, warehouseID: localWarehouseID } = res.locals
  const { keyword } = req.query

  let warehouseID: string
  let status: string | undefined

  if (role === UserRole.PICKER) {
    warehouseID = localWarehouseID
    status = 'ALL'
  } else if (role === UserRole.TRANSPORT_WORKER) {
    warehouseID = localWarehouseID
    status = TaskStatus.PENDING
  } else {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Admin should use /api/admin/tasks',
      'ROLE_FORBIDDEN'
    )
  }

  const tasks = await taskService.getTasksByWarehouseID(
    warehouseID,
    role,
    accountID,
    typeof keyword === 'string' ? keyword : undefined,
    status
  )

  res.status(httpStatus.OK).json({
    success: true,
    tasks
  })
})

export const createTask = asyncHandler(async (req, res) => {
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
    const destinationBin = await binService.getBinByBinCode(destinationBinCode)
    const task = await taskService.binsToPick(
      destinationBin.binCode,
      accountID,
      warehouseID,
      productCode,
      quantity
    )
    return res.status(httpStatus.CREATED).json({
      success: true,
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

  return res.status(httpStatus.OK).json({
    success: true,
    task
  })
})

export const updateTask = asyncHandler(async (req, res) => {
  const { taskID } = req.params
  const { status, sourceBinCode } = req.body
  const { accountID } = res.locals

  const existingTask = await Task.findByPk(taskID)
  if (!existingTask) {
    throw new AppError(httpStatus.NOT_FOUND, 'Task not found', 'TASK_NOT_FOUND')
  }

  const originalStatus = existingTask.status
  const isVirtualBin =
    sourceBinCode === 'Transfer-in' || sourceBinCode === 'Out of Stock'

  let updatedTask
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

  res.status(httpStatus.OK).json({ success: true, task: updatedTask })
})

/////////////////////////////////////////////////////////////////////////////////////////////////

export const getAdminTasks = asyncHandler(async (req, res) => {
  const { role } = res.locals

  if (role !== UserRole.ADMIN) {
    throw new AppError(httpStatus.FORBIDDEN, '❌ Admin only', 'ROLE_FORBIDDEN')
  }

  const warehouseID = req.query.warehouseID as string | undefined
  if (typeof warehouseID !== 'string' || !warehouseID) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Admin must provide a valid warehouseID in query',
      'WAREHOUSE_ID_REQUIRED'
    )
  }

  const rawStatus =
    typeof req.query.status === 'string' ? req.query.status : undefined
  const rawKeyword =
    typeof req.query.keyword === 'string' ? req.query.keyword : undefined

  const status = rawStatus?.trim() || undefined
  const keyword = rawKeyword?.trim() || undefined

  const tasks = await getAdminTasksByWarehouseID(warehouseID, keyword, status)

  res.status(httpStatus.OK).json({
    success: true,
    tasks
  })
})
