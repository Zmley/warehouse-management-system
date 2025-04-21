import { Inventory } from './inventory.model'
import { Bin } from 'routes/bins/bin.model'
import { Sequelize, WhereOptions } from 'sequelize'
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
  limit = 20
) => {
  const binWhere: WhereOptions = { warehouseID }
  if (binID) {
    Object.assign(binWhere, { binID })
  }

  const result = await Inventory.findAndCountAll({
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

export const deleteInventoryByInventoryID = async (
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

export const addInventory = async ({
  productCode,
  binID,
  quantity
}: {
  productCode: string
  binID: string
  quantity: number
}) => {
  try {
    const existingItem = await Inventory.findOne({
      where: { productCode, binID }
    })

    if (existingItem) {
      existingItem.quantity += quantity
      await existingItem.save()

      return {
        message: `Product quantity updated successfully.`,
        data: existingItem
      }
    }

    const newItem = await Inventory.create({
      productCode,
      binID,
      quantity
    })

    return {
      message: `add new product successfully.`,
      data: newItem
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to add inventory item')
  }
}

export const updateInventoryByInventoryID = async (
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
