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

  //update each inventory row by for loop
  for (const { inventoryID, quantity } of productList) {
    const inventoryItem = await Inventory.findOne({
      where: { inventoryID, binID: carID }
    })

    const currentQuantity = inventoryItem.quantity
    const productID = inventoryItem.productID

    const targetInventory = await Inventory.findOne({
      where: { binID: unLoadBinID, productID }
    })

    //update target inventory row, creat one row if there is no target Inventory, which means new to this bin.
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

    //update inventory in car, delete whole inventory row if I move all, delete partical if I move paticially
    if (currentQuantity === quantity) {
      await inventoryItem.destroy()
    } else {
      await inventoryItem.update({ quantity: currentQuantity - quantity })
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
    throw new AppError(500, `❌ Failed to check cargo in car: ${cartID}`)
  }
}
