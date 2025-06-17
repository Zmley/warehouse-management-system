import Task from './task.model'
import Inventory from 'routes/inventory/inventory.model'
import Bin from 'routes/bins/bin.model'
import AppError from 'utils/appError'
import { Op, Sequelize, WhereOptions } from 'sequelize'
import { UserRole } from 'constants/uerRole'
import { TaskWithJoin } from 'types/task'
import { TaskStatus } from 'constants/tasksStatus'
import {
  checkInventoryQuantity,
  hasInventoryInCart
} from 'routes/inventory/inventory.service'
import { getBinByBinCode } from 'routes/bins/bin.service'
import { v4 as uuidv4 } from 'uuid'
import { BinType } from 'constants/binType'
import Account from 'routes/accounts/accounts.model'

export const hasActiveTask = async (
  accountID: string
): Promise<Task | null> => {
  try {
    const activeTask = await Task.findOne({
      where: { accepterID: accountID, status: TaskStatus.IN_PROCESS }
    })

    return activeTask
  } catch (error) {
    console.error('❌ Error checking active task:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Error checking active task')
  }
}

export const binToBin = async (
  sourceBinID: string,
  destinationBinID: string,
  productCode: string,
  accountID: string,
  quantity: number
) => {
  try {
    const existingTask = await checkBinAvailability(sourceBinID)

    if (existingTask) {
      throw new AppError(409, '❌ Source Bin is already in task')
    }

    await checkInventoryQuantity(sourceBinID, productCode, quantity)

    const task = await Task.create({
      sourceBinID,
      destinationBinID,
      creatorID: accountID,
      productCode,
      status: TaskStatus.PENDING,
      quantity
    })

    return task
  } catch (error) {
    console.error('❌ Error creating task as admin:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to create task as admin')
  }
}

export const acceptTaskByTaskID = async (accountID: string, taskID: string) => {
  try {
    const isActive = await hasActiveTask(accountID)
    if (isActive) {
      throw new AppError(409, '❌ You already have an active task in progress.')
    }

    const cartHasCargo = await hasInventoryInCart(accountID)
    if (cartHasCargo) {
      throw new AppError(
        409,
        '❌ Please unload your cart before accepting a new task.'
      )
    }

    const task = await Task.findOne({ where: { taskID } })
    if (!task) {
      throw new AppError(404, '❌ Task not found.')
    }

    if (task.status !== 'PENDING') {
      throw new AppError(400, '❌ Task is already in progress.')
    }

    task.accepterID = accountID
    task.status = TaskStatus.IN_PROCESS
    await task.save()

    return task
  } catch (error) {
    console.error('❌ Error accepting task:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to accept task')
  }
}

export const checkBinAvailability = async (sourceBinID: string) => {
  try {
    const existingTask = await Task.findOne({
      where: { sourceBinID, status: TaskStatus.IN_PROCESS }
    })

    return existingTask
  } catch (error) {
    console.error('❌ Error checking bin availability:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to check bin availability')
  }
}

export const binsToPick = async (
  binCode: string,
  accountID: string,
  warehouseID: string,
  productCode: string,
  quantity: number
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
      `❌  ${binCode} is not in system of current warehouse or this is not a PICK_UP bin`
    )
  }

  const inventories = await Inventory.findAll({
    where: { productCode },
    include: [
      {
        model: Bin,
        as: 'bin',
        where: {
          warehouseID,
          type: 'INVENTORY'
        },
        attributes: ['binCode']
      }
    ]
  })

  const sourceBins = inventories.map(inv => ({
    binCode: (inv as { Bin?: { binCode?: string } }).Bin?.binCode || 'UNKNOWN'
  }))

  const task = await Task.create({
    destinationBinID: destinationBin.binID,
    creatorID: accountID,
    productCode,
    status: TaskStatus.PENDING,
    quantity
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
      status: TaskStatus.IN_PROCESS
    }
  })

  if (!myCurrentTask) return

  let sourceBins = []

  if (myCurrentTask.sourceBinID) {
    const sourceBin = await Bin.findOne({
      where: { binID: myCurrentTask.sourceBinID },
      attributes: ['binID', 'binCode']
    })

    const matchingInventory = await Inventory.findOne({
      where: {
        binID: myCurrentTask.sourceBinID,
        productCode: myCurrentTask.productCode
      },
      attributes: ['inventoryID', 'quantity', 'productCode']
    })

    if (sourceBin) {
      sourceBins = [
        {
          inventoryID: matchingInventory?.inventoryID || null,
          productCode: myCurrentTask.productCode,
          quantity: matchingInventory?.quantity || 0,
          bin: sourceBin
        }
      ]
    }
  } else {
    const inventories = await Inventory.findAll({
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
      ],
      attributes: ['inventoryID', 'productCode', 'quantity']
    })

    sourceBins = inventories
  }

  const destinationBin = await Bin.findOne({
    where: { binID: myCurrentTask.destinationBinID },
    attributes: ['binCode']
  })

  const destinationBinCode = destinationBin?.binCode || '--'

  return {
    ...myCurrentTask.toJSON(),
    sourceBins,
    destinationBinCode
  }
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

  if (role === UserRole.ADMIN) {
    task = await Task.findByPk(taskID)

    if (!task) {
      throw new AppError(404, '❌ Task not found')
    }

    task.status = TaskStatus.CANCELED
    await task.save()
  } else if (role === UserRole.PICKER) {
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
      attributes: ['binID', 'binCode', 'warehouseID'],
      required: true,
      where: { warehouseID }
    },
    {
      model: Bin,
      as: 'sourceBin',
      attributes: ['binID', 'binCode', 'warehouseID'],
      required: false
    },
    {
      model: Inventory,
      as: 'inventories',
      required: false,
      include: [
        {
          model: Bin,
          as: 'bin',
          attributes: ['binID', 'binCode', 'warehouseID'],
          required: true,
          where: {
            warehouseID,
            type: 'INVENTORY'
          }
        }
      ]
    },
    {
      model: Account,
      as: 'accepter',
      attributes: ['accountID', 'firstName', 'lastName'],
      required: false
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
        Sequelize.fn('LOWER', Sequelize.col('inventories->bin.binCode')),
        { [Op.like]: `%${lowerKeyword}%` }
      )
    ]
  }

  return whereClause
}

const mapTasks = (tasks: TaskWithJoin[]) => {
  return tasks.map(task => {
    let sourceBins: unknown[] = []

    if (task.sourceBin) {
      sourceBins = [
        {
          bin: task.sourceBin,
          quantity: task.quantity,
          productCode: task.productCode
        }
      ]
    } else if (task.inventories?.length > 0) {
      sourceBins = task.inventories
    }

    return {
      ...task.toJSON(),

      inventories: undefined,
      sourceBin: undefined,

      sourceBins,
      destinationBinCode: task.destinationBin?.binCode || '--'
    }
  })
}

const getWhereClauseForRole = (
  role: UserRole,
  status?: string,
  accountID?: string,
  keyword?: string
): WhereOptions<Task> => {
  if (role === 'PICKER') {
    if (!accountID) {
      throw new AppError(400, '❌ Picker must provide accountID')
    }

    return {
      creatorID: accountID,
      status: status === 'ALL' ? ['PENDING', 'COMPLETED'] : status
    }
  }

  return getAdminWhereClause(status, keyword)
}

export const getTasksByWarehouseID = async (
  warehouseID: string,
  role: UserRole,
  accountID?: string,
  keyword?: string,
  status?: string
) => {
  const whereClause = getWhereClauseForRole(role, status, accountID, keyword)

  const includeClause = getIncludeClause(warehouseID)

  const tasks = (await Task.findAll({
    where: whereClause,
    include: includeClause,
    order: [['updatedAt', 'DESC']]
  })) as unknown as TaskWithJoin[]

  if (!tasks.length) {
    return []
  }

  return mapTasks(tasks)
}

export const checkIfPickerTaskPublished = async (
  warehouseID: string,
  productCode: string,
  destinationBinCode: string
) => {
  try {
    const binCode = destinationBinCode.trim().toUpperCase()
    const bin = await getBinByBinCode(binCode)

    if (!bin) {
      throw new AppError(404, `❌ Bin with code ${binCode} not found.`)
    }

    const existing = await Task.findOne({
      where: {
        destinationBinID: bin.binID,
        productCode,
        status: 'PENDING'
      }
    })

    if (existing) {
      throw new AppError(
        400,
        `❌ Task for product ${productCode} in Pick up bin ${bin.binCode} already exists.`
      )
    }

    return bin
  } catch (err) {
    console.error('❌ Failed to check if task is published:', err)
    if (err instanceof AppError) throw err
    throw new AppError(500, '❌ Unexpected error checking task publication')
  }
}

export const releaseTask = async (
  taskID: string,
  accountID: string,
  cartID: string,
  warehouseID: string
) => {
  const task = await Task.findOne({
    where: { taskID, accepterID: accountID }
  })

  if (!task) {
    throw new AppError(404, '❌ Task not found or not owned by user')
  }

  const itemsInCart = await Inventory.findAll({ where: { binID: cartID } })

  if (!itemsInCart.length) {
    throw new AppError(400, '❌ No items in cart to release')
  }

  const tempAisleBin = await Bin.create({
    binCode: `AISLE-${uuidv4().slice(0, 8)}`,
    warehouseID: warehouseID,
    type: BinType.AISLE
  })

  await Promise.all(
    itemsInCart.map(item => item.update({ binID: tempAisleBin.binID }))
  )

  task.status = TaskStatus.PENDING
  task.accepterID = null
  task.sourceBinID = tempAisleBin.binID
  await task.save()

  return task
}

export const updateTaskService = async (
  taskID: string,
  status: string,
  sourceBinCode: string
) => {
  const bin = await Bin.findOne({
    where: { binCode: sourceBinCode }
  })

  if (!bin) {
    throw new Error('Bin code not found')
  }

  const [affectedRows] = await Task.update(
    {
      status,
      sourceBinID: bin.binID
    },
    {
      where: { taskID },
      returning: true
    }
  )

  if (affectedRows === 0) {
    throw new Error('Task not found or not updated')
  }

  return await Task.findOne({ where: { taskID } })
}
