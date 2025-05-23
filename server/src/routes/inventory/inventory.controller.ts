import { Request, Response, NextFunction } from 'express'
import * as inventoryService from './inventory.service'

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

    if (!warehouseID || typeof warehouseID !== 'string') {
      res.status(400).json({ message: 'Missing or invalid warehouseID' })
      return
    }

    const parsedPage = parseInt(page as string, 10)
    const parsedLimit = parseInt(limit as string, 10)

    const { rows, count } = await inventoryService.getInventoriesByWarehouseID(
      warehouseID,
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
      return res.status(200).json(updatedItem)
    } else {
      return res.status(404).json({ message: 'Inventory item not found' })
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
      result
    })
  } catch (error) {
    next(error)
  }
}
