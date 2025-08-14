import Inventory from 'routes/inventory/inventory.model'
import Bin from 'routes/bins/bin.model'
import AppError from 'utils/appError'
import { getTaskByAccountID } from 'routes/tasks/task.service'
import { BinType } from 'constants/index'
import { Transaction } from 'sequelize'

// export const moveInventoriesToBin = async (
//   inventories: { inventoryID: string; quantity: number }[],
//   bin: Bin
// ): Promise<number> => {
//   const binID = bin.binID

//   return await Inventory.sequelize!.transaction(async (t: Transaction) => {
//     let updatedItemCount = 0

//     for (const item of inventories) {
//       const src = await Inventory.findOne({
//         where: { inventoryID: item.inventoryID },
//         transaction: t,
//         lock: t.LOCK.UPDATE
//       })

//       if (!src) {
//         throw new AppError(404, `❌ Inventory "${item.inventoryID}" not found.`)
//       }

//       if (item.quantity <= 0) {
//         throw new AppError(
//           400,
//           `❌ Quantity must be > 0 for "${item.inventoryID}".`
//         )
//       }

//       if (item.quantity > src.quantity) {
//         throw new AppError(
//           400,
//           `❌ Quantity ${item.quantity} exceeds available ${src.quantity} for "${item.inventoryID}".`
//         )
//       }

//       if (bin.type === BinType.PICK_UP || bin.type === BinType.AISLE) {
//         const remain = src.quantity - item.quantity
//         if (remain <= 0) {
//           await src.destroy({ transaction: t })
//         } else {
//           await src.update({ quantity: remain }, { transaction: t })
//         }
//         updatedItemCount++
//         continue
//       }

//       await Inventory.create(
//         {
//           binID,
//           productCode: src.productCode,
//           quantity: item.quantity
//         },
//         { transaction: t }
//       )

//       const remain = src.quantity - item.quantity
//       if (remain <= 0) {
//         await src.destroy({ transaction: t })
//       } else {
//         await src.update({ quantity: remain }, { transaction: t })
//       }

//       updatedItemCount++
//     }

//     return updatedItemCount
//   }).catch(err => {
//     if (err instanceof AppError) throw err
//     throw new AppError(500, '❌ Failed to move inventories to target bin')
//   })
// }

// inventoryMoves.ts
export const moveInventoriesToBin = async (
  inventories: {
    inventoryID: string
    quantity: number
    merge?: boolean
    targetInventoryID?: string
  }[],
  bin: Bin
): Promise<number> => {
  const binID = bin.binID

  return await Inventory.sequelize!.transaction(async (t: Transaction) => {
    let updatedItemCount = 0

    for (const item of inventories) {
      const src = await Inventory.findOne({
        where: { inventoryID: item.inventoryID },
        transaction: t,
        lock: t.LOCK.UPDATE
      })

      if (!src)
        throw new AppError(404, `❌ Inventory "${item.inventoryID}" not found.`)

      if (item.quantity <= 0) {
        throw new AppError(
          400,
          `❌ Quantity must be > 0 for "${item.inventoryID}".`
        )
      }
      if (item.quantity > src.quantity) {
        throw new AppError(
          400,
          `❌ Quantity ${item.quantity} exceeds available ${src.quantity} for "${item.inventoryID}".`
        )
      }

      // 不可放入 PICK_UP / AISLE（你的原有规则）
      if (bin.type === BinType.PICK_UP || bin.type === BinType.AISLE) {
        const remain = src.quantity - item.quantity
        if (remain <= 0) await src.destroy({ transaction: t })
        else await src.update({ quantity: remain }, { transaction: t })
        updatedItemCount++
        continue
      }

      // 目标：合并 or 新建
      if (item.merge) {
        // 优先：如果带了 targetInventoryID，则严格合并到该条
        if (item.targetInventoryID) {
          const target = await Inventory.findOne({
            where: { inventoryID: item.targetInventoryID },
            transaction: t,
            lock: t.LOCK.UPDATE
          })
          if (!target) {
            throw new AppError(
              404,
              `❌ Target inventory "${item.targetInventoryID}" not found.`
            )
          }
          // 目标必须在同一个 bin 且 productCode 一致
          if (target.binID !== binID) {
            throw new AppError(
              400,
              `❌ Target inventory "${item.targetInventoryID}" is not in bin "${bin.binCode}".`
            )
          }
          if (target.productCode !== src.productCode) {
            throw new AppError(
              400,
              `❌ Product mismatch: source ${src.productCode} vs target ${target.productCode}.`
            )
          }

          await target.update(
            { quantity: target.quantity + item.quantity },
            { transaction: t }
          )
        } else {
          // 未指定 target：合并到该 bin 内任意同款（若不存在则创建）
          const existing = await Inventory.findOne({
            where: { binID, productCode: src.productCode },
            transaction: t,
            lock: t.LOCK.UPDATE
          })

          if (existing) {
            await existing.update(
              { quantity: existing.quantity + item.quantity },
              { transaction: t }
            )
          } else {
            await Inventory.create(
              { binID, productCode: src.productCode, quantity: item.quantity },
              { transaction: t }
            )
          }
        }
      } else {
        // 不合并：总是新建一条
        await Inventory.create(
          { binID, productCode: src.productCode, quantity: item.quantity },
          { transaction: t }
        )
      }

      // 扣减/删除来源
      const remain = src.quantity - item.quantity
      if (remain <= 0) await src.destroy({ transaction: t })
      else await src.update({ quantity: remain }, { transaction: t })

      updatedItemCount++
    }

    return updatedItemCount
  }).catch(err => {
    if (err instanceof AppError) throw err
    throw new AppError(500, '❌ Failed to move inventories to target bin')
  })
}

// export const unloadByBinCode = async (
//   binCode: string,
//   unloadProductList: { inventoryID: string; quantity: number }[]
// ): Promise<{ message: string }> => {
//   try {
//     const bin = await Bin.findOne({
//       where: { binCode }
//     })

//     if (!bin) {
//       throw new AppError(404, `❌  ${binCode} not found in system`)
//     }

//     const updatedCount = await moveInventoriesToBin(unloadProductList, bin)

//     if (updatedCount === 0) {
//       throw new AppError(404, `❌ No inventory was moved to bin "${binCode}".`)
//     }

//     return {
//       message: `✅ ${updatedCount} product(s) successfully unloaded into bin "${binCode}".`
//     }
//   } catch (error) {
//     console.error('Error unloading to bin:', error)
//     if (error instanceof AppError) throw error
//     throw new AppError(500, '❌ Failed to unload inventories to bin')
//   }
// }

// cartService.ts
export const unloadByBinCode = async (
  binCode: string,
  unloadProductList: {
    inventoryID: string
    quantity: number
    merge?: boolean
    targetInventoryID?: string
  }[]
): Promise<{ updatedCount: number }> => {
  try {
    const bin = await Bin.findOne({ where: { binCode } })
    if (!bin) throw new AppError(404, `❌ ${binCode} not found in system`)

    const updatedCount = await moveInventoriesToBin(unloadProductList, bin)
    if (updatedCount === 0) {
      throw new AppError(404, `❌ No inventory was moved to bin "${binCode}".`)
    }

    return { updatedCount }
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
  warehouseID: string,
  selectedItems?: { inventoryID: string; quantity: number }[]
): Promise<{ message: string }> => {
  try {
    const bin = await Bin.findOne({ where: { binCode } })
    if (!bin) throw new AppError(404, `❌ Bin ${binCode} not found in system`)

    await validateSourceBinAccess(accountID, warehouseID, binCode)

    if (!selectedItems || selectedItems.length === 0) {
      throw new AppError(400, `❌ No items selected to load from ${binCode}.`)
    }

    const cartBin = await Bin.findOne({ where: { binID: cartID } })
    if (!cartBin) throw new AppError(404, '❌ Cart bin not found')

    await moveInventoriesToBin(selectedItems, cartBin)

    return {
      message: `✅ Selected products loaded from bin ${binCode}.`
    }
  } catch (error) {
    console.error('❌ Error loading from bin:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to load selected items from bin')
  }
}

export const loadByProductCode = async (
  productCode: string,
  quantity: number,
  cartID: string
): Promise<{ message: string }> => {
  try {
    if (!productCode || quantity <= 0) {
      throw new AppError(
        400,
        '❌ productCode required and quantity must be > 0'
      )
    }

    await Inventory.create({
      binID: cartID,
      productCode,
      quantity
    })

    return {
      message: `✅ ${quantity} units of ${productCode} loaded to cart.`
    }
  } catch (error) {
    console.error('❌ Error loading by productCode:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to load product by code.')
  }
}
