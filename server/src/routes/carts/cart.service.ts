import Inventory from 'routes/inventory/inventory.model'
import Bin from 'routes/bins/bin.model'
import AppError from 'utils/appError'
import { getTaskByAccountID } from 'routes/tasks/task.service'
// import { BinType } from 'constants/binType'
// import { Op } from 'sequelize'

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

export const validateSourceBinAccess = async (
  accountID: string,
  warehouseID: string,
  binCode: string
): Promise<void> => {
  const task = await getTaskByAccountID(accountID, warehouseID)
  if (!task) return

  const allowedBinCodes = task.sourceBins
    .map(b => b.bin?.binCode)
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

export const getAllowedBinIDs = async (
  accountID: string,
  warehouseID: string
): Promise<string[] | null> => {
  const task = await getTaskByAccountID(accountID, warehouseID)
  if (!task) return null

  const binIDs = task.sourceBins.map(b => b.binID).filter(Boolean)
  if (!binIDs.length) {
    throw new AppError(400, '❌ No valid source bins for current task.')
  }

  return binIDs
}

export const loadByBinCode = async (
  binCode: string,
  cartID: string,
  accountID: string,
  warehouseID: string
): Promise<{ message: string }> => {
  try {
    const bin = await Bin.findOne({ where: { binCode } })
    if (!bin) throw new AppError(404, `❌ Bin ${binCode} not found in system`)

    await validateSourceBinAccess(accountID, warehouseID, binCode)

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
    console.error('❌ Error loading from bin:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to load items from bin')
  }
}

export const loadByProductCode = async (
  productCode: string,
  quantity: number,
  cartID: string
  // accountID: string,
  // warehouseID: string
): Promise<{ message: string }> => {
  try {
    // const allowedBinIDs = await getAllowedBinIDs(accountID, warehouseID)

    // const sourceInventory = await Inventory.findOne({
    //   where: {
    //     productCode,
    //     quantity: { [Op.gte]: quantity }
    //   },
    //   include: [
    //     {
    //       model: Bin,
    //       as: 'bin',
    //       where: {
    //         warehouseID,
    //         type: BinType.INVENTORY,
    //         ...(allowedBinIDs ? { binID: { [Op.in]: allowedBinIDs } } : {})
    //       }
    //     }
    //   ]
    // })

    // if (!sourceInventory) {
    //   throw new AppError(
    //     404,
    //     `❌ No bin found with enough quantity of ${productCode}.`
    //   )
    // }

    // sourceInventory.quantity -= quantity
    // await sourceInventory.save()

    const [cartInventory, created] = await Inventory.findOrCreate({
      where: {
        productCode,
        binID: cartID
      },
      defaults: {
        quantity: quantity
      }
    })

    if (!created) {
      cartInventory.quantity += quantity
      await cartInventory.save()
    }

    return {
      message: `✅ ${quantity} units of ${productCode} loaded to cart.`
    }
  } catch (error) {
    console.error('❌ Error loading by productCode:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to load product by code.')
  }
}
