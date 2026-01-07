import httpStatus from 'constants/httpStatus'
import AppError from 'utils/appError'
import Account from 'routes/accounts/accounts.model'
import Bin from 'routes/bins/bin.model'
import Warehouse from './warehouse.model'

export const getWarehouses = async () => {
  return await Warehouse.findAll()
}

export const getWarehouseByID = async (warehouseID: string) => {
  const warehouse = await Warehouse.findOne({ where: { warehouseID } })
  if (!warehouse) {
    throw new Error('Warehouse not found')
  }
  return warehouse
}

export const createWarehouse = async (warehouseCode: string) => {
  const code = warehouseCode.trim()
  if (!code) {
    throw new AppError(httpStatus.BAD_REQUEST, 'warehouseCode is required')
  }

  const existing = await Warehouse.findOne({ where: { warehouseCode: code } })
  if (existing) {
    throw new AppError(httpStatus.CONFLICT, 'warehouseCode already exists')
  }

  return Warehouse.create({ warehouseCode: code })
}

export const updateWarehouseCode = async (
  warehouseID: string,
  warehouseCode: string
) => {
  const code = warehouseCode

  const warehouse = await Warehouse.findOne({ where: { warehouseID } })
  if (!warehouse) {
    throw new AppError(httpStatus.NOT_FOUND, 'Warehouse not found')
  }

  const existing = await Warehouse.findOne({ where: { warehouseCode: code } })
  if (existing && existing.warehouseID !== warehouseID) {
    throw new AppError(httpStatus.CONFLICT, 'warehouseCode already exists')
  }

  await warehouse.update({ warehouseCode: code })
  return warehouse
}

export const deleteWarehouseByID = async (warehouseID: string) => {
  const warehouse = await Warehouse.findOne({ where: { warehouseID } })
  if (!warehouse) {
    throw new AppError(httpStatus.NOT_FOUND, 'Warehouse not found')
  }

  const binCount = await Bin.count({ where: { warehouseID } })
  if (binCount > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Warehouse has bins and cannot be deleted'
    )
  }

  const accountCount = await Account.count({ where: { warehouseID } })
  if (accountCount > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Warehouse has accounts and cannot be deleted'
    )
  }

  await Warehouse.destroy({ where: { warehouseID } })
  return { success: true }
}
