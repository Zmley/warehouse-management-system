import Task from './task.model'
import Inventory from 'routes/inventory/inventory.model'
import Bin from 'routes/bins/bin.model'
import AppError from 'utils/appError'
import { Op, Sequelize, Transaction, WhereOptions } from 'sequelize'
import { UserRole, TaskStatus } from 'constants/index'
import {
  checkInventoryQuantity,
  getCartInventories
} from 'routes/inventory/inventory.service'
import { getBinByBinCode } from 'routes/bins/bin.service'
import Account from 'routes/accounts/accounts.model'
import {
  moveInventoriesToBin,
  unloadByBinCode
} from 'routes/carts/cart.service'
import httpStatus from 'constants/httpStatus'
import { sequelize } from 'config/db'
import Warehouse from 'routes/warehouses/warehouse.model'
import Transfer from 'routes/transfers/transfer.model'
import { PageResult, TaskWithJoin } from 'types/transfer'

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
): Promise<void> => {
  const isActive = await hasActiveTask(accountID)
  if (isActive) {
    throw new AppError(
      httpStatus.CONFLICT,
      '❌ You already have an active task in progress.',
      'TASK_ALREADY_ACTIVE'
    )
  }

  const cartInventories = await getCartInventories(cartID)
  if (cartInventories.length > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      '❌ Please unload your cart before accepting a new task.',
      'CART_NOT_EMPTY'
    )
  }

  const task = await Task.findOne({ where: { taskID } })
  if (!task) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      '❌ Task not found.',
      'TASK_NOT_FOUND'
    )
  }

  if (task.status !== TaskStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      '❌ Task is already in progress.',
      'TASK_NOT_PENDING'
    )
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

//////////////////////

// const getIncludeClause = (warehouseID: string) => {
//   return [
//     {
//       model: Bin,
//       as: 'destinationBin',
//       attributes: ['binID', 'binCode', 'warehouseID'],
//       required: true,
//       where: { warehouseID },
//       include: [
//         {
//           model: Warehouse,
//           as: 'warehouse',
//           attributes: ['warehouseID', 'warehouseCode'],
//           required: false
//         }
//       ]
//     },
//     {
//       model: Bin,
//       as: 'sourceBin',
//       attributes: ['binID', 'binCode', 'warehouseID'],
//       required: false,
//       include: [
//         {
//           model: Warehouse,
//           as: 'warehouse',
//           attributes: ['warehouseID', 'warehouseCode'],
//           required: false
//         }
//       ]
//     },
//     {
//       model: Inventory,
//       as: 'inventories',
//       required: false,
//       where: {
//         quantity: { [Op.gt]: 0 }
//       },
//       include: [
//         {
//           model: Bin,
//           as: 'bin',
//           attributes: ['binID', 'binCode', 'warehouseID'],
//           required: true,
//           where: {
//             warehouseID,
//             type: 'INVENTORY'
//           },
//           include: [
//             {
//               model: Warehouse,
//               as: 'warehouse',
//               attributes: ['warehouseID', 'warehouseCode'],
//               required: false
//             }
//           ]
//         }
//       ]
//     },
//     {
//       model: Inventory,
//       as: 'otherInventories',
//       required: false,
//       where: {
//         quantity: { [Op.gt]: 0 }
//       },
//       include: [
//         {
//           model: Bin,
//           as: 'bin',
//           attributes: ['binID', 'binCode', 'warehouseID'],
//           required: true,
//           where: {
//             warehouseID: { [Op.ne]: warehouseID },
//             type: 'INVENTORY'
//           },
//           include: [
//             {
//               model: Warehouse,
//               as: 'warehouse',
//               attributes: ['warehouseID', 'warehouseCode'],
//               required: false
//             }
//           ]
//         }
//       ]
//     },
//     {
//       model: Account,
//       as: 'accepter',
//       attributes: ['accountID', 'firstName', 'lastName'],
//       required: false
//     },
//     {
//       model: Account,
//       as: 'creator',
//       attributes: ['accountID', 'firstName', 'lastName'],
//       required: false
//     },

//     {
//       model: Transfer,
//       as: 'transfers',
//       required: false,
//       attributes: ['transferID', 'status', 'taskID'],
//       where: {
//         status: { [Op.in]: [TaskStatus.PENDING, TaskStatus.IN_PROCESS] }
//       }
//     }
//   ]
// }

// const getAdminWhereClause = (status: string, keyword: string) => {
//   const allowedStatuses = ['PENDING', 'COMPLETED', 'CANCELED', 'IN_PROCESS']
//   const whereClause: WhereOptions<Task> = {}

//   if (status && allowedStatuses.includes(status)) {
//     whereClause.status = status
//   } else {
//     whereClause.status = { [Op.in]: allowedStatuses }
//   }

//   if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
//     const lowerKeyword = keyword.toLowerCase()
//     whereClause[Op.or] = [
//       Sequelize.where(
//         Sequelize.fn('LOWER', Sequelize.col('Task.productCode')),
//         { [Op.like]: `%${lowerKeyword}%` }
//       ),
//       Sequelize.where(
//         Sequelize.fn('LOWER', Sequelize.col('destinationBin.binCode')),
//         { [Op.like]: `%${lowerKeyword}%` }
//       ),
//       Sequelize.where(
//         Sequelize.fn('LOWER', Sequelize.col('sourceBin.binCode')),
//         { [Op.like]: `%${lowerKeyword}%` }
//       ),
//       Sequelize.where(
//         Sequelize.fn('LOWER', Sequelize.col('inventories->bin.binCode')),
//         { [Op.like]: `%${lowerKeyword}%` }
//       )
//     ]
//   }

//   return whereClause
// }

// const mapTasks = (tasks: TaskWithJoin[]) => {
//   return tasks.map(task => {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const transfers: any[] = task.transfers ?? []
//     const hasPendingTransfer =
//       Array.isArray(transfers) &&
//       transfers.some(t => String(t.status).toUpperCase() === 'PENDING')

//     let sourceBins: unknown[] = []
//     if (task.sourceBin) {
//       sourceBins = [
//         {
//           bin: task.sourceBin,
//           quantity: task.quantity,
//           productCode: task.productCode
//         }
//       ]
//     } else if (task.inventories?.length > 0) {
//       sourceBins = task.inventories
//     }

//     const json = task.toJSON ? task.toJSON() : task
//     return {
//       ...json,

//       inventories: undefined,
//       sourceBin: undefined,
//       transfers: undefined,

//       sourceBins,
//       destinationBinCode: task.destinationBin?.binCode || '--',
//       hasPendingTransfer,
//       transfersCount: transfers.length
//     }
//   })
// }

// const getWhereClauseForRole = (
//   role: UserRole,
//   status?: string,
//   accountID?: string,
//   keyword?: string
// ): WhereOptions<Task> => {
//   if (role === 'PICKER') {
//     if (!accountID) {
//       throw new AppError(400, '❌ Picker must provide accountID')
//     }

//     return {
//       creatorID: accountID,
//       status: status === 'ALL' ? ['PENDING', 'COMPLETED'] : status
//     }
//   }

//   return getAdminWhereClause(status, keyword)
// }

// export const getTasksByWarehouseID = async (
//   warehouseID: string,
//   role: UserRole,
//   accountID?: string,
//   keyword?: string,
//   status?: string
// ) => {
//   const whereClause = getWhereClauseForRole(role, status, accountID, keyword)

//   const includeClause = getIncludeClause(warehouseID)

//   const tasks = (await Task.findAll({
//     where: whereClause,
//     include: includeClause,
//     order: [['updatedAt', 'DESC']]
//   })) as unknown as TaskWithJoin[]

//   if (!tasks.length) {
//     return []
//   }

//   return mapTasks(tasks)
// }

///////////////////////////

// 最小改动版：在 otherInventories -> bin 下补一层 inventories（该 bin 下所有产品库存）

const getIncludeClause = (warehouseID: string) => {
  return [
    // 目标货位（当前仓）
    {
      model: Bin,
      as: 'destinationBin',
      attributes: ['binID', 'binCode', 'warehouseID'],
      required: true,
      where: { warehouseID },
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['warehouseID', 'warehouseCode'],
          required: false
        }
      ]
    },

    // 来源货位（当前仓，若有）
    {
      model: Bin,
      as: 'sourceBin',
      attributes: ['binID', 'binCode', 'warehouseID'],
      required: false,
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['warehouseID', 'warehouseCode'],
          required: false
        }
      ]
    },

    {
      model: Inventory,
      as: 'inventories',
      required: false,
      where: {
        quantity: { [Op.gt]: 0 }
      },
      include: [
        {
          model: Bin,
          as: 'bin',
          attributes: ['binID', 'binCode', 'warehouseID'],
          required: true,
          where: {
            warehouseID,
            type: 'INVENTORY'
          },
          include: [
            {
              model: Warehouse,
              as: 'warehouse',
              attributes: ['warehouseID', 'warehouseCode'],
              required: false
            }
          ]
        }
      ]
    },

    {
      model: Inventory,
      as: 'otherInventories',
      required: false,
      where: {
        quantity: { [Op.gt]: 0 }
      },
      include: [
        {
          model: Bin,
          as: 'bin',
          attributes: ['binID', 'binCode', 'warehouseID'],
          required: true,
          where: {
            warehouseID: { [Op.ne]: warehouseID },
            type: 'INVENTORY'
          },
          include: [
            {
              model: Warehouse,
              as: 'warehouse',
              attributes: ['warehouseID', 'warehouseCode'],
              required: false
            },
            // ★ 新增：把该 bin 里的所有库存也带出来（数量>0）
            {
              model: Inventory,
              as: 'inventories', // 如果你的 Bin->Inventory 关联别名不是 inventories，请改成真实别名
              required: false,
              attributes: [
                'inventoryID',
                'productCode',
                'quantity',
                'binID',
                'createdAt',
                'updatedAt'
              ],
              where: {
                quantity: { [Op.gt]: 0 }
              }
              // 不额外再 include 子层 bin/warehouse，避免响应过大；需要的话也能按需再加
            }
          ]
        }
      ]
    },

    // 接收/创建人
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
    },

    {
      model: Transfer,
      as: 'transfers',
      required: false,
      attributes: ['transferID', 'status', 'taskID'],
      where: {
        status: {
          [Op.in]: [
            TaskStatus.PENDING,
            TaskStatus.IN_PROCESS,
            TaskStatus.COMPLETED
          ]
        }
      }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transfers: any[] = task.transfers ?? []

    // const hasPendingTransfer =
    //   Array.isArray(transfers) &&
    //   transfers.some(t => String(t.status).toUpperCase() === 'PENDING')

    const transferStatus =
      Array.isArray(transfers) && transfers.length > 0
        ? String(transfers[0].status).toUpperCase()
        : null

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

    const json = task.toJSON ? task.toJSON() : task

    return {
      ...json,

      inventories: undefined,
      sourceBin: undefined,
      transfers: undefined,

      sourceBins,
      destinationBinCode: task.destinationBin?.binCode || '--',
      transferStatus,
      transfersCount: transfers.length
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

/////////////////////////////////////////////////////////
export const checkIfTaskDuplicate = async (
  productCode: string,
  destinationBinCode: string,
  sourceBinCode?: string
): Promise<Bin> => {
  try {
    const destinationBin = await getBinByBinCode(destinationBinCode)
    if (!destinationBin) {
      throw new AppError(httpStatus.NOT_FOUND, '', 'DEST_BIN_NOT_FOUND')
    }

    let sourceBinID: string | undefined
    if (sourceBinCode) {
      const sourceBin = await getBinByBinCode(sourceBinCode)
      if (!sourceBin) {
        throw new AppError(httpStatus.NOT_FOUND, '', 'SOURCE_BIN_NOT_FOUND')
      }
      sourceBinID = sourceBin.binID
    }

    const where: WhereOptions = {
      productCode,
      destinationBinID: destinationBin.binID,
      status: { [Op.in]: [TaskStatus.PENDING, TaskStatus.IN_PROCESS] }
    }
    if (sourceBinID) {
      Object.assign(where, { sourceBinID })
    }

    const existing = await Task.findOne({ where })
    if (existing) {
      throw new AppError(httpStatus.CONFLICT, '', 'TASK_DUPLICATE')
    }

    return destinationBin
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      '',
      'INTERNAL_SERVER_ERROR',
      false
    )
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

export const cancelByTransportWorker = async (
  taskID: string,
  cartID: string,
  accountID: string
) => {
  return sequelize.transaction(async (t: Transaction) => {
    const task = await Task.findByPk(taskID, { transaction: t })
    if (!task) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Task not found',
        'TASK_NOT_FOUND'
      )
    }
    if (task.status !== TaskStatus.IN_PROCESS) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        '❌ Only in-process tasks can be cancelled',
        'TASK_NOT_IN_PROCESS'
      )
    }

    const cartInventories = await getCartInventories(cartID)

    if (cartInventories.length > 0) {
      const unloadProductList = cartInventories.map(i => ({
        inventoryID: i.inventoryID,
        quantity: i.quantity
      }))

      const sourceBin = await Bin.findByPk(task.sourceBinID, { transaction: t })
      if (sourceBin?.binCode) {
        await unloadByBinCode(sourceBin.binCode, unloadProductList, accountID)
      }
    }

    await task.update(
      {
        status: TaskStatus.PENDING,
        accepterID: null,
        sourceBinID: null
      },
      { transaction: t }
    )

    return task
  })
}

export const getAdminTasksByWarehouseID = async (
  warehouseID: string,
  keyword?: string,
  status?: string
) => {
  const whereClause = getAdminWhereClause(
    (status || '').toUpperCase().trim() || undefined,
    (keyword || '').trim() || undefined
  )
  const includeClause = getIncludeClause(warehouseID)

  const tasks = (await Task.findAll({
    where: whereClause,
    include: includeClause,
    order: [['updatedAt', 'DESC']]
  })) as unknown as TaskWithJoin[]

  return tasks.length ? mapTasks(tasks) : []
}

const LIKE_OP = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like

export const getAdminFinishedTasksByWarehouseIDPaginated = async (
  warehouseID: string,
  status: 'COMPLETED' | 'CANCELED',
  page = 1,
  pageSize = 20,
  keyword?: string
): Promise<PageResult<TaskWithJoin>> => {
  const offset = Math.max(0, (page - 1) * pageSize)
  const limit = Math.max(1, pageSize)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskWhere: WhereOptions<any> = { status }
  if (keyword && keyword.trim()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(taskWhere as any)[Op.or] = [
      { productCode: { [LIKE_OP]: `%${keyword}%` } }
    ]
  }

  const isCompleted = status === 'COMPLETED'

  const mainBinIncludeForFilter = isCompleted
    ? ({
        model: Bin,
        as: 'destinationBin',
        attributes: [],
        required: true,
        where: { warehouseID }
      } as const)
    : ({
        model: Bin,
        as: 'sourceBin',
        attributes: [],
        required: true,
        where: { warehouseID }
      } as const)

  const extraBinIncludeForKeyword =
    keyword && keyword.trim()
      ? ([
          isCompleted
            ? {
                model: Bin,
                as: 'destinationBin',
                attributes: [],
                required: false,
                where: { binCode: { [LIKE_OP]: `%${keyword}%` } }
              }
            : {
                model: Bin,
                as: 'sourceBin',
                attributes: [],
                required: false,
                where: { binCode: { [LIKE_OP]: `%${keyword}%` } }
              }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any[])
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ([] as any[])

  const total: number = await Task.count({
    where: taskWhere,
    include: [mainBinIncludeForFilter, ...extraBinIncludeForKeyword],
    distinct: true,
    col: 'taskID'
  })

  if (total === 0) {
    return { items: [], page, pageSize: limit, total: 0, totalPages: 1 }
  }

  const idRows = await Task.findAll({
    attributes: ['taskID', 'updatedAt'],
    where: taskWhere,
    include: [mainBinIncludeForFilter, ...extraBinIncludeForKeyword],
    order: [['updatedAt', 'DESC']],
    offset,
    limit,
    subQuery: false
  })

  const ids = idRows.map(r => r.get('taskID')) as string[]
  if (ids.length === 0) {
    return {
      items: [],
      page,
      pageSize: limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  }

  const rows = await Task.findAll({
    where: { taskID: { [Op.in]: ids } },
    attributes: [
      'taskID',
      'productCode',
      'quantity',
      'status',
      'createdAt',
      'updatedAt',
      'destinationBinID',
      'sourceBinID',
      'creatorID',
      'accepterID'
    ],
    include: [
      {
        model: Bin,
        as: 'destinationBin',
        attributes: ['binID', 'binCode', 'warehouseID'],
        required: false
      },
      {
        model: Bin,
        as: 'sourceBin',
        attributes: ['binID', 'binCode', 'warehouseID'],
        required: false
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
      },
      {
        model: Inventory,
        as: 'inventories',
        required: false,
        separate: true,
        attributes: ['inventoryID', 'quantity', 'binID', 'productCode'],
        include: [
          {
            model: Bin,
            as: 'bin',
            attributes: ['binID', 'binCode', 'warehouseID'],
            required: true,
            where: { warehouseID }
          }
        ],
        order: [['inventoryID', 'ASC']]
      }
    ],
    subQuery: false
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapById = new Map<string, any>()
  rows.forEach(r => mapById.set(r.get('taskID') as string, r))
  const ordered = ids.map(id => mapById.get(id)).filter(Boolean)

  return {
    items: ordered,
    page,
    pageSize: limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  }
}
