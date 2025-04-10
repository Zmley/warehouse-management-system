import { Inventory } from './inventory.model'
import Bin from 'routes/bins/bin.model'

export const getInventoriesByCartId = async (
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

//admin

export const getAllInventories = async () => {
  const inventories = await Inventory.findAll({
    include: [
      {
        model: Bin,
        attributes: ['binCode']
      }
    ]
  })

  return inventories
}

export const deleteInventoryItem = async (
  inventoryID: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const inventoryItem = await Inventory.findByPk(inventoryID)

    if (!inventoryItem) {
      return { success: false, message: 'Inventory item not found' }
    }

    await inventoryItem.destroy()
    return { success: true, message: 'Inventory item deleted successfully' }
  } catch (error) {
    console.error(error)
    throw new Error('Error deleting inventory item')
  }
}

export const addInventoryItemService = async ({
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
        success: true,
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
      success: true,
      data: newItem
    }
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to add inventory item'
    }
  }
}

export const updateInventoryItemService = async (
  inventoryID: string,
  updatedFields: { quantity?: number; productID?: string; binID?: string }
) => {
  try {
    const inventoryItem = await Inventory.findByPk(inventoryID)
    if (!inventoryItem) {
      return null
    }

    await inventoryItem.update(updatedFields)
    return inventoryItem
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error('Failed to update inventory item')
  }
}
