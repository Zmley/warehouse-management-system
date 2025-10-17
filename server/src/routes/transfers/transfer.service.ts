import {
  FindAndCountOptions,
  Includeable,
  Op,
  Transaction,
  WhereOptions
} from 'sequelize'
import Bin from '../../routes/bins/bin.model'
import Warehouse from '../../routes/warehouses/warehouse.model'
import Account from '../../routes/accounts/accounts.model'
import Task from '../../routes/tasks/task.model'
import { TaskStatus } from '../../constants'
import Transfer from './transfer.model'
import { sequelize } from 'config/db'
import Inventory from 'routes/inventory/inventory.model'
import Product from 'routes/products/product.model'

const INCLUDE_ALL: Includeable[] = [
  {
    model: Task,
    as: 'task',
    attributes: ['taskID', 'status', 'productCode', 'quantity']
  },
  {
    model: Bin,
    as: 'sourceBin',
    attributes: ['binID', 'binCode', 'warehouseID'],
    include: [
      {
        model: Warehouse,
        as: 'warehouse',
        attributes: ['warehouseID', 'warehouseCode']
      }
    ]
  },
  {
    model: Bin,
    as: 'destinationBin',
    attributes: ['binID', 'binCode', 'warehouseID'],
    include: [
      {
        model: Warehouse,
        as: 'warehouse',
        attributes: ['warehouseID', 'warehouseCode']
      }
    ]
  },
  {
    model: Warehouse,
    as: 'sourceWarehouse',
    attributes: ['warehouseID', 'warehouseCode']
  },
  {
    model: Warehouse,
    as: 'destinationWarehouse',
    attributes: ['warehouseID', 'warehouseCode']
  },
  {
    model: Account,
    as: 'creator',
    attributes: ['accountID', 'firstName', 'lastName']
  }
]

export interface CreateTransferInput {
  taskID?: string | null
  sourceWarehouseID: string
  destinationWarehouseID: string
  sourceBinID?: string | null
  productCode: string
  quantity: number
  createdBy: string
}

export const createTransferService = async ({
  taskID = null,
  sourceWarehouseID,
  destinationWarehouseID,
  sourceBinID = null,
  productCode,
  quantity,
  createdBy
}: CreateTransferInput) => {
  const destBin = await Bin.findOne({
    where: { warehouseID: destinationWarehouseID, binCode: 'Unloading_Zone' }
  })
  if (!destBin) throw new Error('Unloading zone not found')

  return Transfer.create({
    taskID,
    sourceWarehouseID,
    destinationWarehouseID,
    sourceBinID,
    destinationBinID: destBin.binID,
    productCode,
    quantity,
    status: TaskStatus.PENDING,
    createdBy
  })
}

export type TransferListParams = {
  warehouseID: string
  status?: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELED'
  page?: number
  limit?: number
}

// export const getTransfersByWarehouseID = async ({
//   warehouseID,
//   status,
//   page = 1,
//   limit = 10
// }: TransferListParams) => {
//   const safeLimit = Math.max(1, Math.min(200, Number(limit) || 10))
//   const offset = Math.max(0, (page - 1) * safeLimit)

//   const where: WhereOptions = {
//     destinationWarehouseID: warehouseID,
//     ...(status ? { status } : {})
//   }

//   const options: FindAndCountOptions = {
//     where,
//     include: INCLUDE_ALL,
//     order: [['updatedAt', 'DESC']],
//     limit: safeLimit,
//     offset
//   }

//   const { rows, count } = await Transfer.findAndCountAll(options)
//   return { rows, count, page }
// }

export const getTransfersByWarehouseID = async ({
  warehouseID,
  status,
  page = 1,
  limit = 10
}: TransferListParams) => {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 10))
  const offset = Math.max(0, (page - 1) * safeLimit)

  const where: WhereOptions = {
    destinationWarehouseID: warehouseID,
    ...(status ? { status } : {})
  }

  const options: FindAndCountOptions = {
    where,
    include: [
      ...INCLUDE_ALL,
      {
        model: Product,
        as: 'product',
        attributes: ['productCode', 'boxType']
      }
    ],
    order: [['updatedAt', 'DESC']],
    limit: safeLimit,
    offset
  }

  const { rows, count } = await Transfer.findAndCountAll(options)

  const data = rows.map(t => {
    const json = t.toJSON() as any
    return {
      ...json,
      boxType: json.product?.boxType ?? null
    }
  })

  return { rows: data, count, page }
}

////

export const cancelTransferService = async ({
  transferID
}: {
  transferID: string
  canceledBy: string
}) => {
  const t = await Transfer.findByPk(transferID)
  if (!t) throw new Error('Transfer not found')

  if (![TaskStatus.PENDING].includes(t.status as TaskStatus)) {
    throw new Error('Only PENDING or IN_PROCESS transfers can be canceled')
  }

  t.status = TaskStatus.CANCELED

  await t.save()

  return t
}

///////////

type DeleteArgs = {
  taskID: string
  sourceBinID?: string
  deletedBy?: string
}

export const deleteTransfersByTaskService = async ({
  taskID,
  sourceBinID
}: DeleteArgs) => {
  const where: WhereOptions = { taskID, status: TaskStatus.PENDING }
  if (sourceBinID) where.sourceBinID = sourceBinID

  const count = await Transfer.destroy({ where })
  return { count }
}

export const clearInventoryByBinID = async (
  binID: string,
  opts?: { hardDelete?: boolean; transaction?: Transaction }
) => {
  if (!binID) throw new Error('binID is required')

  const { hardDelete = false, transaction } = opts || {}

  if (hardDelete) {
    const deleted = await Inventory.destroy({
      where: { binID },
      transaction
    })
    return { success: true, cleared: deleted, mode: 'DELETE' as const }
  }

  const [affected] = await Inventory.update(
    { quantity: 0 },
    { where: { binID }, transaction }
  )
  return { success: true, cleared: affected, mode: 'ZERO' as const }
}

// type ConfirmAction = 'CONFIRM' | 'UNDO_CONFIRM' | 'COMPLETE'
// type ConfirmItem = { transferID: string; productCode: string }

// export const updateReceiveStatusService = async (
//   items: ConfirmItem[],
//   action: ConfirmAction,
//   opts?: { force?: boolean }
// ) => {
//   if (!items?.length) throw new Error('items is required')

//   const updated: Transfer[] = []
//   const skipped: { transferID: string; reason: string }[] = []

//   let from: TaskStatus, to: TaskStatus

//   if (action === 'CONFIRM') {
//     from = TaskStatus.PENDING
//     to = TaskStatus.IN_PROCESS
//   } else if (action === 'UNDO_CONFIRM') {
//     from = TaskStatus.IN_PROCESS
//     to = TaskStatus.PENDING
//   } else if (action === 'COMPLETE') {
//     from = TaskStatus.IN_PROCESS
//     to = TaskStatus.COMPLETED
//   } else {
//     throw new Error(`Unknown action: ${action}`)
//   }

//   return sequelize.transaction(async tx => {
//     for (const it of items) {
//       try {
//         const t = await Transfer.findOne({
//           where: {
//             transferID: it.transferID,
//             productCode: it.productCode,
//             status: from
//           },
//           lock: tx.LOCK.UPDATE,
//           transaction: tx
//         })
//         if (!t) {
//           skipped.push({
//             transferID: it.transferID,
//             reason: `Not found or not ${from}`
//           })
//           continue
//         }

//         if (
//           action === 'UNDO_CONFIRM' &&
//           !opts?.force &&
//           t.getDataValue('hasPendingTransfer')
//         ) {
//           skipped.push({
//             transferID: it.transferID,
//             reason: 'Undo not allowed'
//           })
//           continue
//         }

//         t.status = to
//         await t.save({ transaction: tx })
//         updated.push(t)
//       } catch (e) {
//         skipped.push({
//           transferID: it.transferID,
//           reason: e?.message || 'Update failed'
//         })
//       }
//     }
//     return {
//       success: true,
//       updatedCount: updated.length,
//       updated,
//       skipped,
//       action
//     }
//   })
// }

type ConfirmAction = 'CONFIRM' | 'UNDO_CONFIRM' | 'COMPLETE'
type ConfirmItem = { transferID: string; productCode: string }

export const updateReceiveStatusService = async (
  items: ConfirmItem[],
  action: ConfirmAction,
  opts?: { force?: boolean }
) => {
  if (!items?.length) throw new Error('items is required')

  const updated: Transfer[] = []
  const skipped: { transferID: string; reason: string }[] = []

  let from: TaskStatus, to: TaskStatus
  if (action === 'CONFIRM') {
    from = TaskStatus.PENDING
    to = TaskStatus.IN_PROCESS
  } else if (action === 'UNDO_CONFIRM') {
    from = TaskStatus.IN_PROCESS
    to = TaskStatus.PENDING
  } else if (action === 'COMPLETE') {
    from = TaskStatus.IN_PROCESS
    to = TaskStatus.COMPLETED
  } else {
    throw new Error(`Unknown action: ${action}`)
  }

  return sequelize.transaction(async tx => {
    for (const it of items) {
      try {
        const t = await Transfer.findOne({
          where: {
            transferID: it.transferID,
            productCode: it.productCode,
            status: from
          },
          lock: tx.LOCK.UPDATE,
          transaction: tx
        })
        if (!t) {
          skipped.push({
            transferID: it.transferID,
            reason: `Not found or not ${from}`
          })
          continue
        }

        if (
          action === 'UNDO_CONFIRM' &&
          !opts?.force &&
          t.getDataValue('hasPendingTransfer')
        ) {
          skipped.push({
            transferID: it.transferID,
            reason: 'Undo not allowed'
          })
          continue
        }

        t.status = to
        await t.save({ transaction: tx })
        updated.push(t)
      } catch (e: any) {
        skipped.push({
          transferID: it.transferID,
          reason: e?.message || 'Update failed'
        })
      }
    }

    // ★ 在 COMPLETE 时：根据本次完成的 transfer 的 sourceBinID，删除该货位全部库存
    if (action === 'COMPLETE' && updated.length) {
      const binIDs = Array.from(
        new Set(
          updated
            .map(
              t =>
                (t.getDataValue?.('sourceBinID') ?? (t as any).sourceBinID) as
                  | string
                  | undefined
            )
            .filter(Boolean) as string[]
        )
      )
      for (const binID of binIDs) {
        await clearInventoryByBinID(binID, {
          hardDelete: true,
          transaction: tx
        })
      }
    }

    return {
      success: true,
      updatedCount: updated.length,
      updated,
      skipped,
      action
    }
  })
}
