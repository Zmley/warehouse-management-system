import { Transaction, WhereOptions } from 'sequelize'
import { sequelize } from 'config/db'
import Transfer from './transfer.model'
import Task from '../../routes/tasks/task.model'
import Bin from '../../routes/bins/bin.model'
import Warehouse from '../../routes/warehouses/warehouse.model'
import Inventory from 'routes/inventory/inventory.model'
import Product from 'routes/products/product.model'
import { TaskStatus } from '../../constants'
import {
  ConfirmAction,
  ConfirmItem,
  CreateTransferInput,
  DeleteArgs,
  TransferListParams
} from 'types/transfer'

export const createTransferByTaskID = async ({
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

  const { rows, count } = await Transfer.findAndCountAll({
    where,
    include: [
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
      { model: Product, as: 'product', attributes: ['productCode', 'boxType'] }
    ],
    order: [['updatedAt', 'DESC']],
    limit: safeLimit,
    offset
  })

  const data = rows.map(t => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = t.toJSON()
    return { ...json, boxType: json.product?.boxType ?? null }
  })

  return { rows: data, count, page }
}

export const deleteTransfersByTaskID = async ({
  taskID,
  sourceBinID
}: DeleteArgs) => {
  const task = await Task.findByPk(taskID)
  if (!task) throw new Error('Task not found')
  if (task.status !== TaskStatus.PENDING) {
    throw new Error(
      `Only pending tasks can be deleted (current: ${task.status})`
    )
  }

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
    const cleared = await Inventory.destroy({ where: { binID }, transaction })
    return { success: true, cleared, mode: 'DELETE' as const }
  }

  const [cleared] = await Inventory.update(
    { quantity: 0 },
    { where: { binID }, transaction }
  )
  return { success: true, cleared, mode: 'ZERO' as const }
}

export const updateTransferStatus = async (
  items: ConfirmItem[],
  action: ConfirmAction,
  opts?: { force?: boolean }
) => {
  if (!items?.length) throw new Error('items is required')

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
  } else throw new Error(`Unknown action: ${action}`)

  const updated: Transfer[] = []
  const skipped: { transferID: string; reason: string }[] = []

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t as any).hasPendingTransfer
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
      } catch (e) {
        skipped.push({
          transferID: it.transferID,
          reason: e?.message || 'Update failed'
        })
      }
    }

    if (action === 'COMPLETE' && updated.length) {
      const binIDs = Array.from(
        new Set(
          updated
            .map(
              t =>
                (t.getDataValue?.('sourceBinID') ?? t.sourceBinID) as
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
      action,
      updatedCount: updated.length,
      updated,
      skipped
    }
  })
}
