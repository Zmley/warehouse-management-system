import Task from './task.model'
import Inventory from '../inventory/inventory.model'
import Bin from '../bins/bin.model'
import AppError from '../../utils/appError'

interface TaskWithJoin extends Task {
  destinationBin?: Bin
  sourceBin?: Bin
  inventories?: (Inventory & { Bin?: Bin })[]
}

export const hasActiveTask = async (accountID: string): Promise<boolean> => {
  try {
    const activeTask = await Task.findOne({
      where: { accepterID: accountID, status: 'IN_PROCESS' }
    })

    return activeTask !== null
  } catch (error) {
    console.error('Error checking active task:', error)
    throw new AppError(500, 'Error checking active task')
  }
}

export const createTaskAsAdmin = async (
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

export const acceptTaskService = async (accountID: string, taskID: string) => {
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
  binID: string,
  accountID: string,
  warehouseID: string,
  productCode: string
) => {
  const inventories = await Inventory.findAll({
    where: { productCode },
    include: [
      {
        model: Bin,
        where: {
          warehouseID,
          type: 'INVENTORY'
        },
        attributes: ['binID']
      }
    ]
  })

  if (inventories.length === 0) {
    throw new AppError(404, 'No bins have this product in this warehouse')
  }

  //extract each binID from inventories
  const sourceBins = inventories.map(inv => ({
    binID: inv.binID
  }))

  const task = await Task.create({
    destinationBinID: binID,
    creatorID: accountID,
    productCode,
    status: 'PENDING'
  })

  return { ...task.toJSON(), sourceBins }
}

export const getCurrentInProcessTask = async (accountID: string) => {
  const task = await Task.findOne({
    where: {
      accepterID: accountID,
      status: 'IN_PROCESS'
    }
  })

  if (!task) {
    throw new AppError(404, '❌ No in-process task found for this account')
  }

  return task
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

export const getBinCodeByBinID = async (
  binID: string
): Promise<string | null> => {
  try {
    const bin = await Bin.findOne({
      where: { binID },
      attributes: ['binCode']
    })

    if (!bin) {
      return null
    }

    return bin.binCode
  } catch (error) {
    console.error('❌ Error fetching binCode:', error)
    throw new Error('Failed to fetch binCode')
  }
}

export const getTasksByWarehouseID = async (warehouseID: string) => {
  const pendingTasks = (await Task.findAll({
    where: { status: 'PENDING' },
    include: [
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
        where: {},
        include: [
          {
            model: Bin,
            attributes: ['binID', 'binCode'],
            where: {
              warehouseID,
              type: 'INVENTORY'
            }
          }
        ]
      }
    ]
  })) as unknown as TaskWithJoin[]

  if (!pendingTasks.length) {
    throw new AppError(404, '❌ No pending tasks found')
  }
  return pendingTasks.map(task => {
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

  const sourceBins = await Inventory.findAll({
    where: { productCode: myCurrentTask.productCode },
    include: [
      {
        model: Bin,
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

export const cancelTaskByID = async (taskID: string) => {
  const task = await Task.findByPk(taskID)

  if (!task) {
    throw new AppError(404, '❌ Task not found')
  }

  if (task.status !== 'IN_PROCESS') {
    throw new AppError(400, '❌ Only tasks in progress can be cancelled')
  }

  task.status = 'PENDING'
  task.accepterID = null
  await task.save()

  return task
}
