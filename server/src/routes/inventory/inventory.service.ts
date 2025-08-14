import { getBinsByBinCodes } from 'routes/bins/bin.service'
import { Inventory } from './inventory.model'
import { Bin } from 'routes/bins/bin.model'
import { Op, WhereOptions, Order, col } from 'sequelize'
import { InventoryUploadType } from 'types/inventory'
import AppError from 'utils/appError'
import { buildBinCodeToIDMap } from 'utils/bin.utils'
// import { getExistingInventoryPairs } from 'utils/inventory.utils'

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
  keyword?: string,
  opts: { sortBy?: 'binCode' | 'updatedAt'; sortOrder?: 'ASC' | 'DESC' } = {}
) => {
  const { sortBy = 'updatedAt', sortOrder = 'DESC' } = opts

  const binWhere: WhereOptions = {
    warehouseID,
    type: { [Op.in]: ['INVENTORY'] }
  }
  if (binID) Object.assign(binWhere, { binID })

  const where: WhereOptions = {}
  if (keyword) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(where as any)[Op.or] = [
      { productCode: keyword },
      // 精确匹配；要模糊就用 Op.iLike 并加 %
      { ['$bin.binCode$']: keyword }
      // 或者：where(col('bin.binCode'), { [Op.eq]: keyword })
    ]
  }

  const order: Order =
    sortBy === 'binCode'
      ? [
          [col('bin.binCode'), sortOrder],
          ['updatedAt', 'DESC']
        ]
      : [
          ['updatedAt', sortOrder],
          [col('bin.binCode'), 'ASC']
        ]

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
    distinct: true,
    subQuery: false,
    offset: (page - 1) * limit,
    limit,
    order
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

  if (inventoryList.length === 0) {
    return { success: true, insertedCount: 0, updatedCount: 0 }
  }

  // 仍然用 binCode -> binID 做映射
  const bins = await getBinsByBinCodes(inventoryList)
  const binCodeToBinID = buildBinCodeToIDMap(bins)

  const BATCH_SIZE = 5

  for (let i = 0; i < inventoryList.length; i += BATCH_SIZE) {
    const batch = inventoryList.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async item => {
        const cleanBinCode = item.binCode.trim()
        const cleanProductCode = item.productCode.trim().toUpperCase()
        const binID = binCodeToBinID.get(cleanBinCode)

        if (!binID) return

        // 不再检查是否已存在，永远 create 一条新记录
        await Inventory.create({
          binID,
          productCode: cleanProductCode,
          quantity: item.quantity
        })
        insertedCount++
      })
    )
  }

  return {
    success: true,
    insertedCount,
    updatedCount: 0
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
