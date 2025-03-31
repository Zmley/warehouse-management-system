import Inventory from '../inventory/inventory.model'
import Bin from '../bins/bin.model'
import AppError from '../../utils/appError'

const moveInventoriesToBin = async (
  inventories: { inventoryID: string; quantity: number }[],
  binCode: string
) => {
  const bin = await Bin.findOne({ where: { binCode } })

  if (!bin) {
    throw new AppError(404, `Bin with code ${binCode} not found`)
  }

  const binID = bin.binID

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

export const loadByBinCode = async (
  binCode: string,
  cartID: string,
  warehouseID: string
): Promise<{ status: number; message: string }> => {
  try {
    const bin = await Bin.findOne({
      where: {
        binCode,
        warehouseID
      }
    })

    if (!bin) {
      throw new AppError(
        404,
        `❌ Bin with code "${binCode}" in warehouse "${warehouseID}" not found`
      )
    }

    const updatedItems = await Inventory.update(
      { binID: cartID },
      { where: { binID: bin.binID } }
    )

    if (!updatedItems[0]) {
      throw new AppError(404, '❌ No inventory updated for the given binCode')
    }

    return {
      status: 200,
      message: `✅ Items loaded from bin "${binCode}" to cart "${cartID}".`
    }
  } catch (error) {
    console.error('❌ Error loading Product:', error)
    throw new AppError(
      500,
      '❌ Failed to load Product due to an internal error.'
    )
  }
}

export const unloadByBinCode = async (
  binCode: string,
  unloadProductList: { inventoryID: string; quantity: number }[],
  warehouseID: string
): Promise<number> => {
  try {
    const bin = await Bin.findOne({ where: { binCode, warehouseID } })

    if (!bin) {
      throw new AppError(
        404,
        `❌ Bin with code "${binCode}" not found in this warehouse.`
      )
    }

    const result = await moveInventoriesToBin(unloadProductList, binCode)
    return result
  } catch (error) {
    console.error('❌ Error in unloadProductListToBinByWoker:', error)
    throw new AppError(
      500,
      '❌ Failed to unload Product due to an internal error.'
    )
  }
}
