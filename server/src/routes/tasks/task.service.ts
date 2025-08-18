import Task from './task.model'
import Inventory from 'routes/inventory/inventory.model'
import Bin from 'routes/bins/bin.model'
import AppError from 'utils/appError'
import { Op, Sequelize, WhereOptions } from 'sequelize'
import { UserRole, TaskStatus } from 'constants/index'
import { TaskWithJoin } from 'types/task'
import {
  checkInventoryQuantity,
  getCartInventories
} from 'routes/inventory/inventory.service'
import { getBinByBinCode } from 'routes/bins/bin.service'
import Account from 'routes/accounts/accounts.model'
import { moveInventoriesToBin } from 'routes/carts/cart.service'

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

export const validateTaskAcceptance = async (
  accountID: string,
  taskID: string,
  cartID: string
) => {
  const isActive = await hasActiveTask(accountID)
  if (isActive) {
    throw new AppError(409, '❌ You already have an active task in progress.')
  }

  const cartInventories = await getCartInventories(cartID)
  if (cartInventories.length > 0) {
    throw new AppError(
      409,
      '❌ Please unload your cart before accepting a new task.'
    )
  }

  const task = await Task.findOne({ where: { taskID } })
  if (!task) {
    throw new AppError(404, '❌ Task not found.')
  }

  if (task.status !== TaskStatus.PENDING) {
    throw new AppError(400, '❌ Task is already in progress.')
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

  console.log(
    `🚨 🚨 🚨 Creating task for product ${destinationBin.binID} to   ${destinationBin} pick from bins:`,
    sourceBins
  )

  const task = await Task.create({
    destinationBinID: destinationBin.binID,
    creatorID: accountID,
    productCode,
    status: TaskStatus.PENDING,
    quantity
  })

  return { ...task.toJSON(), sourceBins }
}

// export const getTaskByAccountID = async (
//   accountID: string,
//   warehouseID: string
// ) => {
//   const myCurrentTask = await Task.findOne({
//     where: {
//       accepterID: accountID,
//       status: TaskStatus.IN_PROCESS
//     }
//   })

//   if (!myCurrentTask) return

//   let sourceBins = []

//   if (myCurrentTask.sourceBinID) {
//     const sourceBin = await Bin.findOne({
//       where: { binID: myCurrentTask.sourceBinID },
//       attributes: ['binID', 'binCode']
//     })

//     const matchingInventory = await Inventory.findOne({
//       where: {
//         binID: myCurrentTask.sourceBinID,
//         productCode: myCurrentTask.productCode
//       },
//       attributes: ['inventoryID', 'quantity', 'productCode']
//     })

//     if (sourceBin) {
//       sourceBins = [
//         {
//           inventoryID: matchingInventory?.inventoryID || null,
//           productCode: myCurrentTask.productCode,
//           quantity: matchingInventory?.quantity || 0,
//           bin: sourceBin
//         }
//       ]
//     }
//   } else {
//     const inventories = await Inventory.findAll({
//       where: { productCode: myCurrentTask.productCode },
//       include: [
//         {
//           model: Bin,
//           as: 'bin',
//           where: {
//             warehouseID,
//             type: 'INVENTORY'
//           },
//           attributes: ['binID', 'binCode']
//         }
//       ],
//       attributes: ['inventoryID', 'productCode', 'quantity']
//     })

//     sourceBins = inventories
//   }

//   const destinationBin = await Bin.findOne({
//     where: { binID: myCurrentTask.destinationBinID },
//     attributes: ['binCode']
//   })

//   const destinationBinCode = destinationBin?.binCode || '--'

//   return {
//     ...myCurrentTask.toJSON(),
//     sourceBins,
//     destinationBinCode
//   }
// }

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

  const productCode = myCurrentTask.productCode
  let sourceBins: Array<{
    inventoryID?: string | null
    productCode: string
    quantity: number
    bin: { binID?: string; binCode?: string }
  }> = []

  if (myCurrentTask.sourceBinID) {
    const sourceBin = await Bin.findOne({
      where: { binID: myCurrentTask.sourceBinID },
      attributes: ['binID', 'binCode']
    })

    if (sourceBin) {
      const row = await Inventory.findOne({
        where: {
          binID: myCurrentTask.sourceBinID,
          productCode
        },
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity']
        ],
        raw: true
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalQuantity = Number((row as any)?.totalQuantity ?? 0)

      sourceBins = [
        {
          inventoryID: null,
          productCode,
          quantity: totalQuantity,
          bin: {
            binID: sourceBin.binID,
            binCode: sourceBin.binCode
          }
        }
      ]
    } else {
      sourceBins = [
        { inventoryID: null, productCode, quantity: 0, bin: { binCode: '--' } }
      ]
    }
  } else {
    const rows = await Inventory.findAll({
      where: { productCode },
      attributes: [
        [Sequelize.col('bin.binID'), 'binID'],
        [Sequelize.col('bin.binCode'), 'binCode'],
        [
          Sequelize.fn('SUM', Sequelize.col('Inventory.quantity')),
          'totalQuantity'
        ]
      ],
      include: [
        {
          model: Bin,
          as: 'bin',
          attributes: [],
          required: true,
          where: {
            warehouseID,
            type: 'INVENTORY'
          }
        }
      ],
      group: ['bin.binID', 'bin.binCode'],
      raw: true
    })

    sourceBins = rows.map(r => ({
      inventoryID: null,
      productCode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      quantity: Number((r as any).totalQuantity ?? 0),
      bin: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        binID: (r as any).binID,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        binCode: (r as any).binCode
      }
    }))
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
    },
    {
      model: Account,
      as: 'creator',
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

export const checkIfTaskDuplicate = async (
  productCode: string,
  destinationBinCode: string,
  sourceBinCode?: string
) => {
  try {
    const destinationBin = await getBinByBinCode(destinationBinCode)
    if (!destinationBin) {
      throw new AppError(
        404,
        `❌ Bin with code ${destinationBinCode} not found.`
      )
    }

    let sourceBinID: string | undefined
    if (sourceBinCode) {
      const sourceBin = await getBinByBinCode(sourceBinCode)
      if (!sourceBin) {
        throw new AppError(404, `❌ Bin with code ${sourceBinCode} not found.`)
      }
      sourceBinID = sourceBin.binID
    }

    const where: WhereOptions = {
      productCode,
      destinationBinID: destinationBin.binID,
      status: [TaskStatus.PENDING, TaskStatus.IN_PROCESS]
    }

    if (sourceBinID) {
      where.sourceBinID = sourceBinID
    }

    const existing = await Task.findOne({ where })

    if (existing) {
      const msg = sourceBinID
        ? `❌ Task already exists for product ${productCode} from source ${sourceBinCode} to destination ${destinationBinCode}.`
        : `❌ Task for product ${productCode} in Pick up bin ${destinationBinCode} already exists.`

      throw new AppError(400, msg)
    }

    return destinationBin
  } catch (err: unknown) {
    console.error('❌ Task duplicate check failed:', err)
    if (err instanceof AppError) throw err
    throw new AppError(500, '❌ Unexpected error during task duplication check')
  }
}

export const updateTaskByTaskID = async ({
  taskID,
  status,
  sourceBinCode,
  sourceBinID,
  quantity,
  accepterID
}: {
  taskID: string
  status?: string
  sourceBinCode?: string
  sourceBinID?: string
  quantity?: number
  accepterID?: string
}) => {
  const task = await Task.findByPk(taskID)
  if (!task) throw new Error('Task not found')

  if (status) task.status = status

  if (sourceBinCode) {
    const bin = await getBinByBinCode(sourceBinCode)
    task.sourceBinID = bin.binID
  }

  if (sourceBinID) task.sourceBinID = sourceBinID

  if (typeof quantity === 'number') {
    task.quantity = quantity
  }

  if (typeof accepterID !== 'undefined') {
    task.accepterID = accepterID
  }
  await task.save()
  return task
}

export const completeTaskByAdmin = async (
  taskID: string,
  sourceBinCode: string,
  accountID: string
): Promise<{ message: string }> => {
  const task = await Task.findByPk(taskID)
  if (!task) throw new AppError(404, '❌ Task not found')

  const sourceBin = await Bin.findOne({ where: { binCode: sourceBinCode } })
  if (!sourceBin) throw new AppError(404, '❌ Source bin not found')

  const destinationBin = await Bin.findByPk(task.destinationBinID)
  if (!destinationBin) throw new AppError(404, '❌ Destination bin not found')

  const inventory = await Inventory.findOne({
    where: {
      binID: sourceBin.binID,
      productCode: task.productCode
    }
  })
  if (!inventory) {
    throw new AppError(
      404,
      `❌ No inventory of product ${task.productCode} in bin ${sourceBinCode}`
    )
  }

  const quantityToMove =
    task.quantity === 0 ? inventory.quantity : task.quantity

  await moveInventoriesToBin(
    [{ inventoryID: inventory.inventoryID, quantity: quantityToMove }],
    destinationBin
  )

  await updateTaskByTaskID({
    taskID,
    status: TaskStatus.COMPLETED,
    sourceBinID: sourceBin.binID,
    quantity: quantityToMove,
    accepterID: accountID
  })

  return {
    message: '✅ Task completed and inventory updated successfully.'
  }
}
