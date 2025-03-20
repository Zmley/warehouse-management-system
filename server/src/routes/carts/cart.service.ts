import Inventory from '../inventory/inventory.model'
import AppError from '../../utils/appError'

export const loadCargoHelper = async (
  binID: string,
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

    return {
      status: 200,
      message: `loaded to cart "${cartID}".`
    }
  } catch (error) {
    console.error('❌ Error loading cargo:', error)
    throw new AppError(500, '❌ Failed to load cargo due to an internal error.')
  }
}

export const unloadCargoHelper = async (
  unLoadBinID: string,

  //update each inventory thronw array function by using promise.all
  productList: { inventoryID: string; quantity: number }[]
): Promise<number> => {
  try {
    const updateTasks = productList.map(async ({ inventoryID, quantity }) => {
      const inventoryItem = await Inventory.findOne({
        where: { inventoryID }
      })

      const currentQuantity = inventoryItem.quantity
      const productID = inventoryItem.productID

      const targetInventory = await Inventory.findOne({
        where: { binID: unLoadBinID, productID }
      })

      // update target inventory and its quantity, creat one if there is no product in this bin
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

      // update inventory in car and its quantity
      if (currentQuantity === quantity) {
        await inventoryItem.destroy()
      } else {
        await inventoryItem.update({ quantity: currentQuantity - quantity })
      }

      return 1
    })

    const results = await Promise.all(updateTasks)

    return results.length
  } catch (error) {
    console.error('❌ Error in unloadCargoHelper:', error)
    throw new AppError(
      500,
      '❌ Failed to unload cargo due to an internal error.'
    )
  }
}
