import { Request, Response, NextFunction } from 'express'
import * as inventoryService from './inventory.service'
import AppError from 'utils/appError'
import { getBinByBinCode } from 'routes/bins/bin.service'
import { getInventoriesByBinID } from './inventory.service'

export const getInventoriesInCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cartID = res.locals.cartID
    const result = await inventoryService.getInventoriesByCartID(cartID)
    res.status(200).json({ inventories: result.inventories })
  } catch (error) {
    next(error)
  }
}

export const getInventories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { warehouseID, binID, page, limit = '20', keyword } = req.query

    const parsedPage = parseInt(page as string, 10) || 1
    const parsedLimit = parseInt(limit as string, 10) || 20

    const { rows, count } = await inventoryService.getInventoriesByWarehouseID(
      warehouseID as string,
      typeof binID === 'string' ? binID : undefined,
      parsedPage,
      parsedLimit,
      typeof keyword === 'string' ? keyword : undefined
    )

    res.status(200).json({ inventories: rows, totalCount: count })
  } catch (error) {
    next(error)
  }
}

export const deleteInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { inventoryID } = req.params
  try {
    const result = await inventoryService.deleteByInventoryID(inventoryID)
    res.status(200).json({ success: true, message: result.message })
  } catch (error) {
    next(error)
  }
}

export const updateInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { inventoryID } = req.params
  const updatedFields = req.body

  try {
    const updatedItem = await inventoryService.updateByInventoryID(
      inventoryID,
      updatedFields
    )

    if (updatedItem) {
      return res.status(200).json({ success: true, updatedItem })
    } else {
      return res
        .status(404)
        .json({ success: false, message: 'Inventory item not found' })
    }
  } catch (error) {
    next(error)
  }
}

export const addInventories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inventories = req.body

    const result = await inventoryService.addInventories(inventories)

    res.status(200).json({
      success: true,
      insertedCount: result.insertedCount,
      updatedCount: result.updatedCount
    })
  } catch (error) {
    next(error)
  }
}

export const getInventoriesByBinCode = async (req: Request, res: Response) => {
  const { binCode } = req.params

  if (typeof binCode !== 'string') {
    throw new AppError(400, '❌ binCode must be provided as a query string')
  }

  try {
    const bin = await getBinByBinCode(binCode)

    const inventories = await getInventoriesByBinID(bin.binID)

    return res.json({ success: true, inventories })
  } catch (error) {
    console.error('❌ Failed to get inventories by binCode:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
