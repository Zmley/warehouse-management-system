import Task from './task.model'
import Inventory from '../inventory/inventory.model'
import Bin from '../bins/bin.model'
import AppError from '../../utils/appError'
import { Op, Sequelize, WhereOptions } from 'sequelize'

interface TaskWithJoin extends Task {
  destinationBin?: Bin
  sourceBin?: Bin
  inventories?: (Inventory & { Bin?: Bin })[]
}

export const hasActiveTask = async (
  accountID: string
): Promise<Task | null> => {
  try {
    const activeTask = await Task.findOne({
      where: { accepterID: accountID, status: 'IN_PROCESS' }
    })

    return activeTask
  } catch (error) {
    console.error('❌ Error checking active task:', error)
    throw new AppError(500, '❌ Error checking active task')
  }
}

export const createAsAdmin = async (
  sourceBinID: string,
  destinationBinID: string,
  productCode: string,
  accountID: string
) => {
  const existingTask = await checkBinAvailability(sourceBinID)

  if (existingTask) {
    throw new AppError(409, 'Source Bin is in task')
  }

  const task = await Task.create({
    sourceBinID,
    destinationBinID,
    creatorID: accountID,
    productCode: productCode,
    status: 'PENDING'
  })
  return task
}

export const acceptTaskByTaskID = async (accountID: string, taskID: string) => {
  const isActive = await hasActiveTask(accountID)
  if (isActive) {
    throw new AppError(409, 'You already have an active task in progress.')
  }

  const task = await Task.findOne({ where: { taskID } })

  if (task.status !== 'PENDING') {
    throw new AppError(400, 'Task is already in progress')
  }

  task.accepterID = accountID
  task.status = 'IN_PROCESS'
  await task.save()

  return task
}

export const checkBinAvailability = async (sourceBinID: string) => {
  const existingTask = await Task.findOne({
    where: { sourceBinID, status: 'IN_PROCESS' }
  })

  return existingTask
}

export const createTaskAsPicker = async (
  binCode: string,
  accountID: string,
  warehouseID: string,
  productCode: string
) => {
  const destinationBin = await Bin.findOne({
    where: {
      binCode: binCode,
      warehouseID,
      type: 'PICK_UP'
    }
  })

  if (!destinationBin) {
    throw new AppError(
      404,
      `❌ No bin found with code "${binCode}" in this warehouse`
    )
  }

  const inventories = await Inventory.findAll({
    where: { productCode },
    include: [
      {
        model: Bin,
        where: {
          warehouseID,
          type: 'INVENTORY'
        },
        attributes: ['binCode']
      }
    ]
  })

  if (inventories.length === 0) {
    throw new AppError(404, '❌ No bins have this product in this warehouse')
  }

  const sourceBins = inventories.map(inv => ({
    binCode: (inv as { Bin?: { binCode?: string } }).Bin?.binCode || 'UNKNOWN'
  }))

  const task = await Task.create({
    destinationBinID: destinationBin.binID,
    creatorID: accountID,
    productCode,
    status: 'PENDING'
  })

  return { ...task.toJSON(), sourceBins }
}

export const completeTask = async (taskID: string) => {
  const task = await Task.findByPk(taskID)

  if (!task) {
    throw new AppError(404, '❌ Task not found')
  }

  task.status = 'COMPLETED'
  await task.save()

  return task
}

export const getTaskByAccountID = async (
  accountID: string,
  warehouseID: string
) => {
  const myCurrentTask = await Task.findOne({
    where: {
      accepterID: accountID,
      status: 'IN_PROCESS'
    }
  })

  if (!myCurrentTask) {
    return
  }

  const sourceBins = await Inventory.findAll({
    where: { productCode: myCurrentTask.productCode },
    include: [
      {
        model: Bin,
        as: 'bin',
        where: {
          warehouseID,
          type: 'INVENTORY'
        },
        attributes: ['binID', 'binCode']
      }
    ]
  })

  const destinationBin = await Bin.findOne({
    where: { binID: myCurrentTask.destinationBinID },
    attributes: ['binCode']
  })

  const destinationBinCode = destinationBin.binCode

  return { ...myCurrentTask.toJSON(), sourceBins, destinationBinCode }
}

export const updateTaskSourceBin = async (taskID: string, binID: string) => {
  await Task.update({ sourceBinID: binID }, { where: { taskID } })
}

export const cancelBytaskID = async (
  taskID: string,
  accountID: string,
  role: string
) => {
  let task

  if (role === 'ADMIN') {
    task = await Task.findByPk(taskID)

    if (!task) {
      throw new AppError(404, '❌ Task not found')
    }

    task.status = 'CANCELED'
    await task.save()
  } else if (role === 'PICKER') {
    task = await Task.findOne({
      where: {
        taskID,
        creatorID: accountID
      }
    })

    if (!task) {
      throw new AppError(404, '❌ Task not found or not owned by picker')
    }

    task.status = 'CANCELED'
    await task.save()
  } else {
    task = await Task.findByPk(taskID)

    if (!task) {
      throw new AppError(404, '❌ Task not found')
    }

    if (task.status !== 'IN_PROCESS') {
      throw new AppError(400, '❌ Only tasks in progress can be cancelled')
    }

    task.status = 'PENDING'
    task.accepterID = null
    await task.save()
  }

  return task
}

const getIncludeClause = (warehouseID: string) => {
  return [
    {
      model: Bin,
      as: 'destinationBin',
      attributes: ['binID', 'binCode'],
      required: false,
      where: { warehouseID }
    },
    {
      model: Bin,
      as: 'sourceBin',
      attributes: ['binID', 'binCode'],
      required: false,
      where: { warehouseID }
    },
    {
      model: Inventory,
      as: 'inventories',
      required: false,
      include: [
        {
          model: Bin,
          as: 'bin',
          attributes: ['binID', 'binCode'],
          where: {
            warehouseID,
            type: 'INVENTORY'
          }
        }
      ]
    }
  ]
}

const getAdminWhereClause = (status: string, keyword: string) => {
  const allowedStatuses = ['PENDING', 'COMPLETED', 'CANCELED', 'IN_PROCESS']
  const whereClause: WhereOptions<Task> = {}

  if (status && allowedStatuses.includes(status)) {
    whereClause.status = status
  } else {
    whereClause.status = { [Op.in]: allowedStatuses }
  }

  if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
    const lowerKeyword = keyword.toLowerCase()
    whereClause[Op.or] = [
      Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('Task.productCode')),
        { [Op.like]: `%${lowerKeyword}%` }
      ),
      Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('destinationBin.binCode')),
        { [Op.like]: `%${lowerKeyword}%` }
      ),
      Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('sourceBin.binCode')),
        { [Op.like]: `%${lowerKeyword}%` }
      ),
      Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('inventories->Bin.binCode')),
        { [Op.like]: `%${lowerKeyword}%` }
      )
    ]
  }

  return whereClause
}

const getPickerWhereClause = (accountID: string) => {
  return { creatorID: accountID, status: ['PENDING', 'COMPLETED'] }
}

const getTransportWorkerWhereClause = () => {
  return { status: 'PENDING' }
}

const mapTasks = (tasks: TaskWithJoin[]) => {
  return tasks.map(task => {
    let sourceBins: (Inventory & { Bin?: Bin })[] = []

    if (task.sourceBin) {
      sourceBins = [{ Bin: task.sourceBin } as Inventory & { Bin?: Bin }]
    } else if (task.inventories?.length > 0) {
      sourceBins = task.inventories
    }

    return {
      ...task.toJSON(),
      sourceBins,
      destinationBinCode: task.destinationBin?.binCode || '--'
    }
  })
}

export const getTasksByWarehouseID = async (
  warehouseID: string,
  role: 'TRANSPORT_WORKER' | 'PICKER' | 'ADMIN',
  accountID?: string,
  keyword?: string,
  status?: string
) => {
  if (role === 'PICKER' && !accountID) {
    throw new AppError(400, '❌ Picker must provide accountID')
  }

  let whereClause: WhereOptions<Task> = {}

  if (role === 'ADMIN') {
    whereClause = getAdminWhereClause(status, keyword)
  } else if (role === 'PICKER') {
    whereClause = getPickerWhereClause(accountID!)
  } else if (role === 'TRANSPORT_WORKER') {
    whereClause = getTransportWorkerWhereClause()
  }

  const includeClause = getIncludeClause(warehouseID)

  const tasks = (await Task.findAll({
    where: whereClause,
    include: includeClause
  })) as unknown as TaskWithJoin[]

  if (!tasks.length) {
    return []
  }

  return mapTasks(tasks)
}
