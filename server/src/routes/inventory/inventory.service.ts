import { Inventory } from './inventory.model'
import { Bin } from 'routes/bins/bin.model'
import { Op, Sequelize, WhereOptions } from 'sequelize'
import { InventoryUploadType } from 'types/inventory'
import AppError from 'utils/appError'

export const getInventoriesByCartID = async (
  cartID: string
): Promise<{
  hasProduct: boolean
  inventories: Inventory[]
}> => {
  const inventories = await Inventory.findAll({
    where: { binID: cartID }
  })

  const hasProduct = inventories.length > 0

  return {
    hasProduct,
    inventories
  }
}

export const getInventoriesByWarehouseID = async (
  warehouseID: string,
  binID?: string,
  page = 1,
  limit = 20,
  keyword?: string
) => {
  const binWhere: WhereOptions = { warehouseID }
  if (binID) {
    Object.assign(binWhere, { binID })
  }

  const where: WhereOptions = {}

  if (keyword) {
    ;(where as any)[Op.or] = [
      { productCode: { [Op.iLike]: `%${keyword}%` } },
      Sequelize.where(Sequelize.col('bin.binCode'), {
        [Op.iLike]: `%${keyword}%`
      })
    ]
  }

  const result = await Inventory.findAndCountAll({
    where,
    include: [
      {
        model: Bin,
        as: 'bin',
        attributes: ['binCode', 'binID'],
        where: binWhere
      }
    ],
    offset: (page - 1) * limit,
    limit,
    order: [[Sequelize.col('bin.binCode'), 'ASC']]
  })

  return result
}

export const deleteByInventoryID = async (
  inventoryID: string
): Promise<{ message: string }> => {
  try {
    const inventoryItem = await Inventory.findByPk(inventoryID)

    if (!inventoryItem) {
      return { message: 'Inventory item not found' }
    }

    await inventoryItem.destroy()
    return { message: 'Inventory item deleted successfully' }
  } catch (error) {
    console.error(error)
    if (error instanceof AppError) throw error

    throw new Error('Error deleting inventory item')
  }
}

export const updateByInventoryID = async (
  inventoryID: string,
  updatedFields: { quantity?: number; productID?: string; binID?: string }
) => {
  try {
    const inventoryItem = await Inventory.findByPk(inventoryID)
    if (!inventoryItem) {
      throw new Error('Inventory item not found')
    }

    await inventoryItem.update(updatedFields)

    return { success: true, updatedItem: inventoryItem }
  } catch (error) {
    if (error instanceof AppError) throw error

    throw new Error(`Failed to update inventory item: ${error.message}`)
  }
}

export const addInventories = async (inventoryList: InventoryUploadType[]) => {
  const skipped: InventoryUploadType[] = []
  let insertedCount = 0

  if (inventoryList.length === 0) {
    return { insertedCount: 0, skipped }
  }

  const binCodes = [...new Set(inventoryList.map(item => item.binCode.trim()))]

  const bins = await Bin.findAll({
    where: {
      binCode: {
        [Op.in]: binCodes
      }
    }
  })

  const binCodeToBinID = new Map<string, string>()
  bins.forEach(bin => {
    binCodeToBinID.set(bin.binCode.trim(), bin.binID)
  })

  const allBinIDs = bins.map(bin => bin.binID)

  const existingInventories = await Inventory.findAll({
    where: {
      binID: {
        [Op.in]: allBinIDs
      }
    }
  })

  const existingPairs = new Set<string>()
  existingInventories.forEach(inv => {
    const key = `${inv.binID}-${inv.productCode.trim().toUpperCase()}`
    existingPairs.add(key)
  })

  await Promise.all(
    inventoryList.map(async item => {
      const cleanBinCode = item.binCode.trim()
      const cleanProductCode = item.productCode.trim().toUpperCase()

      const binID = binCodeToBinID.get(cleanBinCode)

      if (!binID) {
        skipped.push(item)
        return
      }

      const pairKey = `${binID}-${cleanProductCode}`

      if (existingPairs.has(pairKey)) {
        skipped.push(item)
        return
      }

      try {
        await Inventory.create({
          binID,
          productCode: cleanProductCode,
          quantity: item.quantity
        })
        insertedCount++
      } catch (error) {
        throw new AppError(
          500,
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    })
  )

  return {
    insertedCount,
    skippedCount: skipped.length,
    skipped
  }
}
