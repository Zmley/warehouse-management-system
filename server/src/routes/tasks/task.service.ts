import Task from './task.model'
import Inventory from '../inventory/inventory.model'
import Bin from '../bins/bin.model'
import Account from '../accounts/accounts.model'
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

/////////////////////////////////////////////////////////

export const getPickerTasksByCreatorID = async () => {
  const pickerTasks = await Task.findAll({
    where: { creatorID: { [Op.in]: await getPickerIDs() } },
    include: [
      {
        model: Bin,
        as: 'sourceBin',
        attributes: ['binCode', 'warehouseID']
      },
      {
        model: Bin,
        as: 'destinationBin',
        attributes: ['binCode']
      }
    ]
  })

  if (!pickerTasks.length) {
    throw new AppError(404, 'No pending tasks found for picker')
  }

  return pickerTasks
}

const getPickerIDs = async () => {
  const pickerAccounts = await Account.findAll({
    where: { role: 'PICKER' },
    attributes: ['accountID']
  })
  return pickerAccounts.map(account => account.accountID)
}

export const getBinCodesByProductCode = async (
  productCode: string,
  warehouseID: string
) => {
  const bins = await Bin.findAll({
    where: { warehouseID },
    include: [
      {
        model: Inventory,
        where: { productCode },
        attributes: []
      }
    ],
    attributes: ['binCode']
  })

  if (!bins.length) {
    throw new AppError(404, 'No bins have this product in this warehouse')
  }

  return bins.map(bin => bin.binCode)
}

/////////////////////////////////////////

export const getBinCodesByProductCodeAndWarehouse = async (
  productCode: string,
  warehouseID: string
): Promise<string[]> => {
  try {
    const inventories = await Bin.findAll({
      where: {
        warehouseID,
        type: 'INVENTORY'
      },
      include: [
        {
          model: Inventory,
          where: { productCode },
          attributes: []
        }
      ],
      attributes: ['binCode']
    })

    if (!inventories.length) {
      throw new Error('No bins found for the given productCode and warehouse')
    }

    const binCodes = inventories.map(bin => bin.binCode)

    return binCodes
  } catch (error) {
    console.error('Error fetching binCodes:', error)
    throw new Error('Failed to fetch binCodes')
  }
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

export const getPendingTasksService = async (warehouseID: string) => {
  const tasks = await Task.findAll({
    where: { status: 'PENDING' }
  })

  if (!tasks.length) {
    throw new AppError(404, '❌ No pending tasks found')
  }

  const tasksWithBinCodes = await Promise.all(
    tasks.map(async task => {
      let sourceBinCode: string[] = []
      let destinationBinCode: string[] = []

      if (task.sourceBinID) {
        const binCode = await getBinCodeByBinID(task.sourceBinID)
        if (binCode) {
          sourceBinCode = [binCode]
        }
      } else {
        const binCodes = await getBinCodesByProductCodeAndWarehouse(
          task.productCode,
          warehouseID
        )
        sourceBinCode = binCodes
      }

      if (task.destinationBinID) {
        const binCode = await getBinCodeByBinID(task.destinationBinID)
        if (binCode) {
          destinationBinCode = [binCode]
        }
      }

      return {
        taskID: task.taskID,
        sourceBinID: task.sourceBinID,
        sourceBinCode,
        destinationBinID: task.destinationBinID,
        destinationBinCode,
        createdAt: task.createdAt
      }
    })
  )

  return tasksWithBinCodes
}
