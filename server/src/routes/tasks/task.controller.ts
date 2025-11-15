import httpStatus from 'http-status'
import { UserRole, TaskStatus } from 'constants/index'
import * as taskService from 'routes/tasks/task.service'
import * as binService from 'routes/bins/bin.service'
import Task from './task.model'
import AppError from 'utils/appError'
import { asyncHandler } from 'utils/asyncHandler'
import { Request, Response, NextFunction } from 'express'
import {
  getAdminTasksByWarehouseID,
  getAdminFinishedTasksByWarehouseIDPaginated
} from 'routes/tasks/task.service'

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
  const { role, cartID, accountID, warehouseID } = res.locals

  let task: Task | null = null

  if (role === UserRole.ADMIN) {
    task = await taskService.updateTaskByTaskID({
      taskID,
      status: TaskStatus.CANCELED
    })
  } else if (role === UserRole.TRANSPORT_WORKER) {
    task = await taskService.cancelByTransportWorker(
      taskID,
      cartID,
      accountID,
      warehouseID
    )
  } else {
    throw new AppError(httpStatus.FORBIDDEN, 'ROLE_FORBIDDEN', 'ROLE_FORBIDDEN')
  }

  res.status(httpStatus.OK).json({ success: true, task })
})

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

  console.log(warehouseID + 'ttttttttttttttttttttttttt')

  await taskService.checkIfTaskDuplicate(
    productCode,
    destinationBinCode,
    sourceBinCode,
    warehouseID
  )

  if (!sourceBinCode) {
    const destinationBin = await binService.getBinByBinCode(
      destinationBinCode,
      warehouseID
    )
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

  const sourceBin = await binService.getBinByBinCode(sourceBinCode, warehouseID)
  const destinationBin = await binService.getBinByBinCode(
    destinationBinCode,
    warehouseID
  )

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
  const { accountID, warehouseID } = res.locals

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
      sourceBinCode,
      warehouseID
    })
  }

  res.status(httpStatus.OK).json({ success: true, task: updatedTask })
})

export const getAdminTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = res.locals
    if (role !== UserRole.ADMIN) {
      throw new AppError(httpStatus.FORBIDDEN, 'Admin only', 'ROLE_FORBIDDEN')
    }

    const warehouseID =
      typeof req.query.warehouseID === 'string'
        ? req.query.warehouseID
        : undefined
    if (!warehouseID) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'warehouseID is required',
        'WAREHOUSE_ID_REQUIRED'
      )
    }

    const rawStatus =
      typeof req.query.status === 'string' ? req.query.status : undefined
    const rawKeyword =
      typeof req.query.keyword === 'string' ? req.query.keyword : undefined
    const status = rawStatus?.trim().toUpperCase() || undefined
    const keyword = rawKeyword?.trim() || undefined

    const tasks = await getAdminTasksByWarehouseID(warehouseID, keyword, status)
    res.status(httpStatus.OK).json({ success: true, tasks })
  } catch (err) {
    next(err)
  }
}

export const getFinishedTasksController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = res.locals
    if (role !== UserRole.ADMIN) {
      throw new AppError(httpStatus.FORBIDDEN, 'Admin only', 'ROLE_FORBIDDEN')
    }

    const warehouseID =
      typeof req.query.warehouseID === 'string'
        ? req.query.warehouseID
        : undefined
    if (!warehouseID) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'warehouseID is required',
        'WAREHOUSE_ID_REQUIRED'
      )
    }

    const statusRaw = String(req.query.status || '')
      .trim()
      .toUpperCase()
    if (statusRaw !== 'COMPLETED' && statusRaw !== 'CANCELED') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "status must be 'COMPLETED' or 'CANCELED'",
        'FINISHED_STATUS_REQUIRED'
      )
    }

    const keyword =
      typeof req.query.keyword === 'string' && req.query.keyword.trim()
        ? req.query.keyword.trim()
        : undefined
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.max(1, Number(req.query.pageSize) || 20)

    const result = await getAdminFinishedTasksByWarehouseIDPaginated(
      warehouseID,
      statusRaw as TaskStatus.COMPLETED | TaskStatus.CANCELED,
      page,
      pageSize,
      keyword
    )

    res.status(httpStatus.OK).json({
      success: true,
      data: result.items,
      total: result.total
    })
  } catch (err) {
    next(err)
  }
}
