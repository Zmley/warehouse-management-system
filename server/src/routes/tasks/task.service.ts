import Task from './task.model'
import Inventory from '../inventory/inventory.model'
import Bin from '../bins/bin.model'
import AppError from '../../utils/appError'

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
