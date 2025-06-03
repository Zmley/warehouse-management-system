import { getBinsByBinCodes } from 'routes/bins/bin.service'
import { Inventory } from './inventory.model'
import { Bin } from 'routes/bins/bin.model'
import { Op, Sequelize, WhereOptions } from 'sequelize'
import { InventoryUploadType } from 'types/inventory'
import AppError from 'utils/appError'
import { buildBinCodeToIDMap } from 'utils/bin.utils'
import { getExistingInventoryPairs } from 'utils/inventory.utils'
import Account from 'routes/accounts/accounts.model'

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
  let insertedCount = 0
  let updatedCount = 0

  if (inventoryList.length === 0) {
    return { insertedCount: 0, updatedCount: 0 }
  }

  const bins = await getBinsByBinCodes(inventoryList)
  const binCodeToBinID = buildBinCodeToIDMap(bins)
  const allBinIDs = bins.map(bin => bin.binID)

  const existingPairs = await getExistingInventoryPairs(allBinIDs)

  await Promise.all(
    inventoryList.map(async item => {
      const cleanBinCode = item.binCode.trim()
      const cleanProductCode = item.productCode.trim().toUpperCase()
      const binID = binCodeToBinID.get(cleanBinCode)

      if (!binID) return

      const pairKey = `${binID}-${cleanProductCode}`

      if (existingPairs.has(pairKey)) {
        // update quantity
        await Inventory.update(
          { quantity: item.quantity },
          { where: { binID, productCode: cleanProductCode } }
        )
        updatedCount++
      } else {
        // insert new
        await Inventory.create({
          binID,
          productCode: cleanProductCode,
          quantity: item.quantity
        })
        insertedCount++
      }
    })
  )

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

export const hasInventoryInCart = async (
  accountID: string
): Promise<boolean> => {
  const account = await Account.findByPk(accountID)
  if (!account?.cartID) return false

  const items = await Inventory.findAll({
    where: { binID: account.cartID }
  })

  console.log('items ++++++++++', items, items.length > 0)
  return items.length > 0
}
