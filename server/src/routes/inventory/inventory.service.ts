import { getBinsByBinCodes } from 'routes/bins/bin.service'
import { Inventory } from './inventory.model'
import { Bin } from 'routes/bins/bin.model'
import { Op, Sequelize, WhereOptions } from 'sequelize'
import { InventoryUploadType } from 'types/inventory'
import AppError from 'utils/appError'
import { buildBinCodeToIDMap } from 'utils/bin.utils'
import { getExistingInventoryPairs } from 'utils/inventory.utils'

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
  const binWhere: WhereOptions = {
    warehouseID,
    type: {
      [Op.in]: ['INVENTORY', 'CART']
    }
  }

  if (binID) {
    Object.assign(binWhere, { binID })
  }

  const where: WhereOptions = {}

  if (keyword) {
    where[Op.or as keyof WhereOptions] = [
      { productCode: keyword },
      Sequelize.where(Sequelize.col('bin.binCode'), keyword)
    ] as unknown as WhereOptions[]
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

// services/inventoryService.ts
export const updateByInventoryIDs = async (
  updates: {
    inventoryID: string
    quantity?: number
    productCode?: string
  }[]
) => {
  try {
    const results = await Promise.all(
      updates.map(async update => {
        const { inventoryID, quantity, productCode } = update
        const inventoryItem = await Inventory.findByPk(inventoryID)

        if (!inventoryItem) {
          return {
            inventoryID,
            success: false,
            message: 'Inventory item not found'
          }
        }

        await inventoryItem.update({ quantity, productCode })
        return { inventoryID, success: true, updatedItem: inventoryItem }
      })
    )

    return results
  } catch (error) {
    throw new Error(`Failed to bulk update inventories: ${error.message}`)
  }
}

export const addInventories = async (inventoryList: InventoryUploadType[]) => {
  let insertedCount = 0
  let updatedCount = 0

  if (inventoryList.length === 0) {
    return { insertedCount: 0, updatedCount: 0 }
  }

  const bins = await getBinsByBinCodes(inventoryList)
  const binCodeToBinID = buildBinCodeToIDMap(bins)
  const allBinIDs = bins.map(bin => bin.binID)
  const existingPairs = await getExistingInventoryPairs(allBinIDs)

  const BATCH_SIZE = 5

  for (let i = 0; i < inventoryList.length; i += BATCH_SIZE) {
    const batch = inventoryList.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async item => {
        const cleanBinCode = item.binCode.trim()
        const cleanProductCode = item.productCode.trim().toUpperCase()
        const binID = binCodeToBinID.get(cleanBinCode)

        if (!binID) return

        const pairKey = `${binID}-${cleanProductCode}`

        if (existingPairs.has(pairKey)) {
          await Inventory.update(
            { quantity: item.quantity },
            { where: { binID, productCode: cleanProductCode } }
          )
          updatedCount++
        } else {
          await Inventory.create({
            binID,
            productCode: cleanProductCode,
            quantity: item.quantity
          })
          insertedCount++
        }
      })
    )
  }

  return {
    insertedCount,
    updatedCount
  }
}

export const checkInventoryQuantity = async (
  sourceBinID: string,
  productCode: string,
  requiredQuantity: number
): Promise<void> => {
  if (productCode === 'ALL') return

  const inventoryItem = await Inventory.findOne({
    where: {
      binID: sourceBinID,
      productCode
    }
  })

  if (!inventoryItem) {
    throw new AppError(
      404,
      `❌ No product ${productCode} found in the source bin`
    )
  }

  if (inventoryItem.quantity < requiredQuantity) {
    throw new AppError(
      400,
      `❌ Not enough inventory. Available: ${inventoryItem.quantity}, Required: ${requiredQuantity}`
    )
  }
}

export const getCartInventories = async (
  cartID: string
): Promise<Inventory[]> => {
  const items = await Inventory.findAll({
    where: { binID: cartID }
  })
  return items
}

export const getInventoriesByBinID = async (
  binID: string
): Promise<Inventory[]> => {
  const inventories = await Inventory.findAll({
    where: { binID },
    include: [
      {
        model: Bin,
        as: 'bin',
        attributes: ['binID', 'binCode']
      }
    ],
    order: [['productCode', 'ASC']]
  })

  return inventories
}
