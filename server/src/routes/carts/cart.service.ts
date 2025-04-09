import Inventory from '../inventory/inventory.model'
import Bin from '../bins/bin.model'
import AppError from '../../utils/appError'
import Warehouse from 'routes/warehouses/warehouse.model'

const moveInventoriesToBin = async (
  inventories: { inventoryID: string; quantity: number }[],
  bin: Bin
) => {
  const binID = bin.binID

  let updatedItemCount = 0

  const updatedInventories = inventories.map(async item => {
    const inventory = await Inventory.findOne({
      where: { inventoryID: item.inventoryID }
    })

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
): Promise<{ message: string }> => {
  const warehouse = await Warehouse.findOne({ where: { warehouseID } })

  const warehouseCode = warehouse.warehouseCode

  const bin = await Bin.findOne({
    where: { binCode, warehouseID }
  })

  if (!bin) {
    throw new AppError(
      404,
      `❌ Bin with code "${binCode}" not found in warehouse "${warehouseCode}"`
    )
  }

  const [updatedCount] = await Inventory.update(
    { binID: cartID },
    { where: { binID: bin.binID } }
  )

  if (updatedCount === 0) {
    throw new AppError(404, `❌ This bin "${binCode}" is empty.`)
  }

  return {
    message: `✅ Items loaded from bin "${binCode}" to cart "${cartID}".`
  }
}

export const unloadByBinCode = async (
  binCode: string,
  unloadProductList: { inventoryID: string; quantity: number }[],
  warehouseID: string
): Promise<{ message: string }> => {
  const warehouse = await Warehouse.findOne({ where: { warehouseID } })

  const warehouseCode = warehouse.warehouseCode

  const bin = await Bin.findOne({
    where: { binCode, warehouseID }
  })

  if (!bin) {
    throw new AppError(
      404,
      `❌ Bin with code "${binCode}" not found in warehouse "${warehouseCode}"`
    )
  }

  const updatedCount = await moveInventoriesToBin(unloadProductList, bin)

  if (updatedCount === 0) {
    throw new AppError(404, `❌ No inventory was moved to bin "${binCode}".`)
  }

  return {
    message: `✅ ${updatedCount} product(s) successfully unloaded into bin "${binCode}".`
  }
}
