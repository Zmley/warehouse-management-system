import { createTask } from '../tasks/task.service'
import Inventory from '../inventory/inventory.model'
import AppError from '../../utils/appError'

export const loadCargoHelper = async (
  binID: string,
  accountID: string,
  cartID: string
): Promise<{ status: number; message: string }> => {
  try {
    const updatedItems = await Inventory.update(
      { binID: cartID },
      { where: { binID } }
    )

    if (!updatedItems[0]) {
      throw new AppError(404, '❌ No inventory updated for the given binID')
    }

    await createTask(binID, accountID)

    return {
      status: 200,
      message: `✅ BinID updated to "${cartID}".`
    }
  } catch (error) {
    console.error('❌ Error loading cargo:', error)
    throw new AppError(500, '❌ Failed to load cargo due to an internal error.')
  }
}

export const unloadCargoHelper = async (
  unLoadBinID: string,
  carID: string,
  productList: { inventoryID: string; quantity: number }[]
): Promise<number> => {
  let updatedCount = 0

  for (const { inventoryID, quantity } of productList) {
    const inventoryItem = await Inventory.findOne({
      where: { inventoryID, binID: carID }
    })

    if (!inventoryItem) {
      console.warn(`⚠️ Inventory item ${inventoryID} not found in car ${carID}`)
      continue
    }

    const currentQuantity = inventoryItem.quantity
    const productID = inventoryItem.productID

    if (currentQuantity < quantity) {
      console.warn(
        `⚠️ Requested unload quantity (${quantity}) exceeds car stock (${currentQuantity}) for inventory ${inventoryID}`
      )
      continue
    }

    const targetInventory = await Inventory.findOne({
      where: { binID: unLoadBinID, productID }
    })

    if (targetInventory) {
      await targetInventory.update({
        quantity: targetInventory.quantity + quantity
      })
    } else {
      await Inventory.create({
        binID: unLoadBinID,
        productID,
        quantity
      })
    }

    if (currentQuantity === quantity) {
      await inventoryItem.destroy()
      console.log(
        `✅ Fully moved and deleted inventory ${inventoryID} from car ${carID}`
      )
    } else {
      await inventoryItem.update({ quantity: currentQuantity - quantity })
      console.log(
        `✅ Partially moved inventory ${inventoryID}, reduced quantity by ${quantity} from car ${carID}`
      )
    }

    updatedCount++
  }

  return updatedCount
}

export const hasCargoInCar = async (cartID: string): Promise<boolean> => {
  try {
    const cargoCount = await Inventory.count({
      where: { binID: cartID }
    })

    return cargoCount > 0
  } catch (error) {
    console.error(`❌ Error checking cargo in car ${cartID}:`, error)
    return false
  }
}
