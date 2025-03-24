import Inventory from '../inventory/inventory.model'
import AppError from '../../utils/appError'

export const getInvetoriesOnCartByProductCode = async (
  cartID: string,
  productCode: string
) => {
  const inventories = await Inventory.findAll({
    where: {
      binID: cartID,
      ...(productCode !== 'ALL' && { productCode })
    },
    attributes: ['inventoryID', 'quantity']
  })

  if (!inventories.length) {
    throw new AppError(404, '❌ No matching inventory found in the cart')
  }

  return inventories
}

const moveInventoriesToBin = async (
  inventories: { inventoryID: string; quantity: number }[],
  binID: string
) => {
  const updatedInventories = inventories.map(async item => {
    const inventory = await Inventory.findOne({
      where: { inventoryID: item.inventoryID }
    })

    if (inventory) {
      await inventory.update({ binID })
    }
  })

  return await Promise.all(updatedInventories)
}

export const unloadProductToBin = async ({
  cartID,
  productCode,
  binID
}: {
  cartID: string
  productCode: string
  binID: string
}) => {
  const inventories = await getInvetoriesOnCartByProductCode(
    cartID,
    productCode
  )
  const result = await moveInventoriesToBin(inventories, binID)

  return result
}

export const loadProductByBinID = async (
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

export const unloadProductToBinByWoker = async (
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
      const productID = inventoryItem.productCode

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

export const unloadCargo = async (
  unLoadBinID: string,

  //update each inventory thronw array function by using promise.all
  unloadProductList: { inventoryID: string; quantity: number }[]
): Promise<number> => {
  try {
    const updateInventores = unloadProductList.map(
      async ({ inventoryID, quantity }) => {
        const inventoryItem = await Inventory.findOne({
          where: { inventoryID }
        })

        const currentQuantity = inventoryItem.quantity
        const productCode = inventoryItem.productCode

        const targetInventory = await Inventory.findOne({
          where: { binID: unLoadBinID, productCode }
        })

        // update target inventory and its quantity, creat one if there is no product in this bin
        if (targetInventory) {
          await targetInventory.update({
            quantity: targetInventory.quantity + quantity
          })
        } else {
          await Inventory.create({
            binID: unLoadBinID,
            productCode,
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
      }
    )

    const results = await Promise.all(updateInventores)

    if (results.length === 0) {
      throw new AppError(404, '❌ No matching inventory unload to this bin')
    }

    return results.length
  } catch (error) {
    console.error('❌ Error in unloadCargoHelper:', error)
    throw new AppError(
      500,
      '❌ Failed to unload cargo due to an internal error.'
    )
  }
}
