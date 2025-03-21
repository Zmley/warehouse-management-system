import Task from './task.model'
import Inventory from '../inventory/inventory.model'
import Bin from '../bins/bin.model'
import { getDefaultProduct } from '../bins/bin.service'
import AppError from '../../utils/appError'
import { Op } from 'sequelize'

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

export const createTask = async (
  sourceBinID: string,
  destinationBinID: string,
  productList: any,
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
    productID: JSON.stringify(productList),
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

export const createPickerTaskService = async (
  binID: string,
  accountID: string,
  warehouseID: string
) => {
  await checkExistingPickUpTask(binID)

  const productID = await getDefaultProduct(binID)

  const inventories = await Inventory.findAll({
    where: { productID },
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
    productID,
    status: 'PENDING'
  })

  return { task, sourceBins }
}

export const checkExistingPickUpTask = async (binID: string) => {
  const existingTask = await Task.findOne({
    where: {
      destinationBinID: binID,
      status: {
        [Op.in]: ['PENDING', 'IN_PROCESS']
      }
    },
    order: [['createdAt', 'DESC']]
  })

  if (existingTask) {
    throw new AppError(
      409,
      'A pending or in-process task already exists for this picker bin.'
    )
  }
}
