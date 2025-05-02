import Inventory from 'routes/inventory/inventory.model'
import Bin from 'routes/bins/bin.model'
import AppError from 'utils/appError'
import { getTaskByAccountID } from 'routes/tasks/task.service'
// import Task from 'routes/tasks/task.model'

const moveInventoriesToBin = async (
  inventories: { inventoryID: string; quantity: number }[],
  bin: Bin
): Promise<number> => {
  try {
    const binID = bin.binID
    let updatedItemCount = 0

    const updatedInventories = inventories.map(async item => {
      const inventory = await Inventory.findOne({
        where: { inventoryID: item.inventoryID }
      })

      if (!inventory) {
        throw new AppError(
          404,
          `❌ Inventory item with ID "${item.inventoryID}" not found.`
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
  } catch (error) {
    console.error('Error moving inventories:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to move inventories to target bin')
  }
}

// export const loadByBinCode = async (
//   binCode: string,
//   cartID: string
// ): Promise<{ message: string }> => {
//   try {
//     const bin = await Bin.findOne({ where: { binCode } })

//     if (!bin) {
//       throw new AppError(404, `❌ BIn ${binCode} not found in system`)
//     }

//     const [updatedCount] = await Inventory.update(
//       { binID: cartID },
//       { where: { binID: bin.binID } }
//     )

//     if (updatedCount === 0) {
//       throw new AppError(404, `❌ ${binCode} is empty.`)
//     }

//     return {
//       message: `✅ Products loaded from bin ${binCode}.`
//     }
//   } catch (error) {
//     console.error('Error loading from bin:', error)
//     if (error instanceof AppError) throw error
//     throw new AppError(500, '❌ Failed to load items from bin')
//   }
// }

export const loadByBinCode = async (
  binCode: string,
  cartID: string,
  accountID: string,
  warehouseID: string
): Promise<{ message: string }> => {
  try {
    const bin = await Bin.findOne({ where: { binCode } })

    if (!bin) {
      throw new AppError(404, `❌ Bin ${binCode} not found in system`)
    }

    //
    const task = await getTaskByAccountID(accountID, warehouseID)

    if (task) {
      const allowedBinCodes = task.sourceBins
        .map(item => item.bin?.binCode)
        .filter(Boolean)

      if (!allowedBinCodes.includes(binCode)) {
        throw new AppError(
          400,
          `❌ You have an active task. Only allowed to load from: ${allowedBinCodes.join(
            ', '
          )}`
        )
      }
    }

    const [updatedCount] = await Inventory.update(
      { binID: cartID },
      { where: { binID: bin.binID } }
    )

    if (updatedCount === 0) {
      throw new AppError(404, `❌ ${binCode} is empty.`)
    }

    return {
      message: `✅ Products loaded from bin ${binCode}.`
    }
  } catch (error) {
    console.error('Error loading from bin:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to load items from bin')
  }
}

export const unloadByBinCode = async (
  binCode: string,
  unloadProductList: { inventoryID: string; quantity: number }[]
): Promise<{ message: string }> => {
  try {
    const bin = await Bin.findOne({
      where: { binCode }
    })

    if (!bin) {
      throw new AppError(404, `❌  ${binCode} not found in system`)
    }

    const updatedCount = await moveInventoriesToBin(unloadProductList, bin)

    if (updatedCount === 0) {
      throw new AppError(404, `❌ No inventory was moved to bin "${binCode}".`)
    }

    return {
      message: `✅ ${updatedCount} product(s) successfully unloaded into bin "${binCode}".`
    }
  } catch (error) {
    console.error('Error unloading to bin:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to unload inventories to bin')
  }
}
