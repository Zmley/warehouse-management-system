import Inventory from 'routes/inventory/inventory.model'
import Bin from 'routes/bins/bin.model'
import AppError from 'utils/appError'
import { BinType } from 'constants/index'
import { Transaction } from 'sequelize'
import {
  createOpenLogsOnLoad,
  fulfillLogsOnUnload
} from 'routes/log/log.service'
import { getFulfillItemsByInventories } from 'routes/inventory/inventory.service'

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

      if (bin.type === BinType.PICK_UP || bin.type === BinType.AISLE) {
        const remain = src.quantity - item.quantity
        if (remain <= 0) await src.destroy({ transaction: t })
        else await src.update({ quantity: remain }, { transaction: t })
        updatedItemCount++
        continue
      }

      if (item.merge) {
        if (item.targetInventoryID) {
          const target = await Inventory.findOne({
            where: { inventoryID: item.targetInventoryID },
            transaction: t,
            lock: t.LOCK.UPDATE
          })

          await target.update(
            { quantity: target.quantity + item.quantity },
            { transaction: t }
          )
        } else {
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
        await Inventory.create(
          { binID, productCode: src.productCode, quantity: item.quantity },
          { transaction: t }
        )
      }

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

export const unloadByBinCode = async (
  binCode: string,
  unloadProductList: {
    inventoryID: string
    quantity: number
    merge?: boolean
    targetInventoryID?: string
  }[],
  accountID?: string
): Promise<{ updatedCount: number }> => {
  try {
    const bin = await Bin.findOne({ where: { binCode } })
    if (!bin) throw new AppError(404, `❌ ${binCode} not found in system`)

    const fulfillItems =
      accountID && unloadProductList.length
        ? await getFulfillItemsByInventories(unloadProductList)
        : []

    const updatedCount = await moveInventoriesToBin(unloadProductList, bin)
    if (updatedCount === 0) {
      throw new AppError(404, `❌ No inventory was moved to bin "${binCode}".`)
    }

    if (accountID && fulfillItems.length) {
      await fulfillLogsOnUnload({
        accountID,
        destinationBinCode: binCode,
        items: fulfillItems
      })
    }

    return { updatedCount }
  } catch (error) {
    console.error('Error unloading to bin:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to unload inventories to bin')
  }
}

export const loadByBinCode = async (
  binCode: string,
  cartID: string,
  selectedItems?: { inventoryID: string; quantity: number }[],
  accountID?: string
): Promise<{ message: string }> => {
  try {
    const bin = await Bin.findOne({ where: { binCode } })
    if (!bin) throw new AppError(404, `❌ Bin ${binCode} not found in system`)

    const cartBin = await Bin.findOne({ where: { binID: cartID } })
    if (!cartBin) throw new AppError(404, '❌ Cart bin not found')

    const openLogItems =
      accountID && selectedItems.length
        ? await getFulfillItemsByInventories(selectedItems)
        : []

    await moveInventoriesToBin(selectedItems, cartBin)

    if (accountID && openLogItems.length) {
      await createOpenLogsOnLoad({
        accountID,
        sourceBinCode: binCode,
        items: openLogItems
      })
    }

    return {
      message: `✅ Selected products loaded from bin ${binCode}.`
    }
  } catch (error) {
    console.error('❌ Error loading from bin:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to load selected items from bin')
  }
}

export const loadByProductList = async (
  productList: { productCode: string; quantity: number }[],
  cartID: string,
  accountID: string
): Promise<{ messages: string[] }> => {
  const messages: string[] = []

  for (const item of productList) {
    await Inventory.create({
      binID: cartID,
      productCode: item.productCode,
      quantity: item.quantity
    })

    messages.push(
      `✅ ${item.quantity} units of ${item.productCode} loaded to cart.`
    )
  }

  await createOpenLogsOnLoad({
    accountID,
    sourceBinCode: null,
    items: productList
  })

  return { messages }
}
