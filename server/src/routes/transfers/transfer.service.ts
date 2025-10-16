import { FindAndCountOptions, Includeable, Op, WhereOptions } from 'sequelize'
import Bin from '../../routes/bins/bin.model'
import Warehouse from '../../routes/warehouses/warehouse.model'
import Account from '../../routes/accounts/accounts.model'
import Task from '../../routes/tasks/task.model'
import { TaskStatus } from '../../constants'
import Transfer from './transfer.model'
import { sequelize } from 'config/db'
// import { TransferListParams } from 'types/transfer'

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

  //   const exists = await Transfer.findOne({
  //     where: {
  //       taskID,
  //       productCode,
  //       sourceWarehouseID,
  //       destinationWarehouseID,
  //       sourceBinID,
  //       destinationBinID: destBin.binID,
  //       status: { [Op.in]: [TaskStatus.PENDING, TaskStatus.IN_PROCESS] }
  //     }
  //   })
  //   if (exists) throw new Error('Transfer already exists')

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

// export const getTransfersByWarehouseID = async ({
//   warehouseID,
//   status,
//   page = 1
// }: TransferListParams) => {
//   const limit = 10
//   const offset = Math.max(0, (page - 1) * limit)

//   const where: WhereOptions = {
//     destinationWarehouseID: warehouseID,
//     ...(status ? { status } : {})
//   }

//   const options: FindAndCountOptions = {
//     where,
//     include: INCLUDE_ALL,
//     order: [['updatedAt', 'DESC']],
//     limit,
//     offset
//   }

//   const { rows, count } = await Transfer.findAndCountAll(options)
//   return { rows, count, page }
// }

export type TransferListParams = {
  warehouseID: string
  status?: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELED'
  page?: number
  limit?: number
}

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
    include: INCLUDE_ALL,
    order: [['updatedAt', 'DESC']],
    limit: safeLimit,
    offset
  }

  const { rows, count } = await Transfer.findAndCountAll(options)
  return { rows, count, page }
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

//////////////////

// export type ConfirmItem = {
//   transferID: string
//   productCode: string
//   productID?: string
//   quantity: number
// }

// export const confirmReceiveService = async (items: ConfirmItem[]) => {
//   if (!Array.isArray(items) || items.length === 0) {
//     throw new Error('items is required')
//   }

//   const updated: Transfer[] = []
//   const skipped: { transferID: string; reason: string }[] = []

//   for (const it of items) {
//     try {
//       const where: WhereOptions = {
//         transferID: it.transferID,
//         productCode: it.productCode,
//         status: TaskStatus.PENDING
//       }

//       const t = await Transfer.findOne({ where })
//       if (!t) {
//         skipped.push({
//           transferID: it.transferID,
//           reason: 'Not found or not PENDING'
//         })
//         continue
//       }

//       t.status = TaskStatus.IN_PROCESS
//       await t.save()

//       updated.push(t)
//     } catch (e) {
//       skipped.push({
//         transferID: it.transferID,
//         reason: e?.message || 'Update failed'
//       })
//     }
//   }

//   return {
//     success: true,
//     updatedCount: updated.length,
//     updated,
//     skipped
//   }
// }

// types
type ConfirmAction = 'CONFIRM' | 'UNDO_CONFIRM'
type ConfirmItem = { transferID: string; productCode: string }

export const updateReceiveStatusService = async (
  items: ConfirmItem[],
  action: ConfirmAction = 'CONFIRM',
  { force = false }: { force?: boolean } = {}
) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('items is required')
  }

  const updated: Transfer[] = []
  const skipped: { transferID: string; reason: string }[] = []

  const fromTo =
    action === 'CONFIRM'
      ? { must: TaskStatus.PENDING, next: TaskStatus.IN_PROCESS }
      : { must: TaskStatus.IN_PROCESS, next: TaskStatus.PENDING }

  const skip = (transferID: string, reason: string) =>
    skipped.push({ transferID, reason })

  return sequelize.transaction(async tx => {
    for (const it of items) {
      try {
        const t = await Transfer.findOne({
          where: {
            transferID: it.transferID,
            productCode: it.productCode,
            status: fromTo.must
          },
          lock: tx.LOCK.UPDATE,
          transaction: tx
        })

        if (!t) {
          skip(it.transferID, `Not found or not ${fromTo.must}`)
          continue
        }

        // 撤销确认时的保护（除非 force）
        if (action === 'UNDO_CONFIRM' && !force) {
          if (t.getDataValue('hasPendingTransfer') === true) {
            skip(it.transferID, 'Downstream transfer exists, undo not allowed')
            continue
          }
        }

        t.status = fromTo.next
        await t.save({ transaction: tx })
        updated.push(t)
      } catch (e: any) {
        skip(it.transferID, e?.message || 'Update failed')
      }
    }

    return {
      success: true,
      action,
      updatedCount: updated.length,
      updated,
      skipped
    }
  })
}
