import { Op, Transaction, WhereOptions } from 'sequelize'
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
  TransferListParams
} from 'types/transfer'
import httpStatus from 'http-status'
import AppError from 'utils/appError'
import { updateTaskByTaskID } from 'routes/tasks/task.service'

export const createTransferByTaskID = async ({
  taskID = null,
  sourceWarehouseID,
  destinationWarehouseID,
  sourceBinID = null,
  productCode,
  quantity,
  createdBy,
  batchID
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
    createdBy,
    batchID
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

export const deleteTransfersByIDs = async ({
  transferIDs
}: {
  transferIDs: string[]
}) => {
  if (!Array.isArray(transferIDs) || transferIDs.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No transferIDs provided')
  }

  const rows = await Transfer.findAll({
    where: { transferID: { [Op.in]: transferIDs } }
  })

  if (rows.length === 0) {
    return { count: 0 }
  }

  const nonPending = rows
    .filter(r => r.status !== TaskStatus.PENDING)
    .map(r => r.transferID)

  if (nonPending.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Only pending transfers can be deleted. Non-pending: ${nonPending.join(
        ', '
      )}`
    )
  }

  const count = await Transfer.destroy({
    where: {
      transferID: { [Op.in]: transferIDs },
      status: TaskStatus.PENDING
    }
  })

  return { count }
}

export const isBinInSpecialWarehouseByID = async (
  binID: string
): Promise<boolean> => {
  if (!binID) throw new Error('binID is required')

  const specialWarehouses = await Warehouse.findAll({
    where: {
      warehouseCode: {
        [Op.or]: [
          { [Op.like]: '%680%' },
          { [Op.like]: '%1630%' },
          { [Op.like]: '%1824%' },
          { [Op.like]: '%1824%' }
        ]
      }
    },
    attributes: ['warehouseID']
  })

  if (!specialWarehouses.length) return false

  const specialWarehouseIDs = specialWarehouses.map(w => w.warehouseID)

  const bin = await Bin.findOne({
    where: { binID },
    attributes: ['warehouseID']
  })

  if (!bin) return false

  return specialWarehouseIDs.includes(bin.warehouseID)
}

export const clearInventoryByBinID = async (
  binID: string,
  opts?: { transaction?: Transaction }
) => {
  if (!binID) throw new Error('binID is required')

  const { transaction } = opts || {}

  const deleted = await Inventory.destroy({
    where: { binID },
    transaction
  })

  const shouldDeleteBin = await isBinInSpecialWarehouseByID(binID)

  if (shouldDeleteBin) {
    await Bin.destroy({ where: { binID }, transaction })
  }

  return { success: true, deleted, mode: 'DELETE' as const }
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
        await clearInventoryByBinID(binID, { transaction: tx })
      }

      const linkedTaskIDs = Array.from(
        new Set(
          updated
            .map(
              t =>
                t.taskID ??
                (t.getDataValue && t.getDataValue('taskID')) ??
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (t as any).relatedTaskID ??
                (t.getDataValue && t.getDataValue('relatedTaskID')) ??
                null
            )
            .filter(Boolean)
            .map(String)
        )
      )

      for (const taskID of linkedTaskIDs) {
        try {
          const { updated, skippedReason } = await completeLinkedTaskIfNeeded(
            taskID
          )
          if (!updated && skippedReason) {
            skipped.push({
              transferID: `(task:${taskID})`,
              reason: skippedReason
            })
          }
        } catch (e) {
          skipped.push({
            transferID: `(task:${taskID})`,
            reason: `Cancel linked task failed: ${e?.message || 'Unknown'}`
          })
        }
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

export async function completeLinkedTaskIfNeeded(taskID: string) {
  if (!taskID) return { updated: false, skippedReason: 'empty_task_id' }

  const task = await Task.findOne({ where: { taskID }, attributes: ['status'] })
  if (!task) return { updated: false, skippedReason: 'linked_task_not_found' }

  const status = String(task.status || '').toUpperCase()

  if (status === 'IN_PROCESS' || status === 'COMPLETED') {
    return {
      updated: false,
      skippedReason: `task_already_${status.toLowerCase()}`
    }
  }

  await updateTaskByTaskID({
    taskID,
    status: 'COMPLETED',
    sourceBinCode: 'Transfer-in'
  })
  return { updated: true }
}
