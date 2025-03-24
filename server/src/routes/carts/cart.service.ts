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
  let updatedItemCount = 0

  const updatedInventories = inventories.map(async item => {
    const inventory = await Inventory.findOne({
      where: { inventoryID: item.inventoryID }
    })

    if (!inventory) {
      throw new AppError(
        404,
        `❌ Inventory with ID ${item.inventoryID} not found`
      )
    }

    const targetInventory = await Inventory.findOne({
      where: { binID, productCode: inventory.productCode }
    })

    if (targetInventory) {
      await targetInventory.update({
        quantity: targetInventory.quantity + item.quantity
      })
    } else {
      await Inventory.create({
        binID,
        productCode: inventory.productCode,
        quantity: item.quantity
      })
    }

    await inventory.update({
      quantity: inventory.quantity - item.quantity
    })

    if (inventory.quantity === 0) {
      await inventory.destroy()
    }

    updatedItemCount++

    return item
  })

  await Promise.all(updatedInventories)

  return updatedItemCount
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

export const unloadProductListToBinByWoker = async (
  binID: string,
  unloadProductList: { inventoryID: string; quantity: number }[]
): Promise<number> => {
  try {
    const result = await moveInventoriesToBin(unloadProductList, binID)

    return result
  } catch (error) {
    console.error('❌ Error in unloadProductListToBinByWoker:', error)
    throw new AppError(
      500,
      '❌ Failed to unload cargo due to an internal error.'
    )
  }
}
