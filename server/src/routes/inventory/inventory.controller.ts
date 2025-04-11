import { Request, Response, NextFunction } from 'express'
import * as inventoryService from './inventory.service'

export const getInventoriesByCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cartID = res.locals.cartID
    const result = await inventoryService.getInventoriesByCartId(cartID)
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
    const { warehouseID } = req.query

    if (!warehouseID || typeof warehouseID !== 'string') {
      res.status(400).json({ message: 'Missing or invalid warehouseID' })
      return
    }

    const inventories = await inventoryService.getInventoriesByWarehouseID(
      warehouseID
    )
    res.status(200).json({ inventories })
  } catch (error) {
    next(error)
  }
}

export const deleteInventoryItemController = async (
  req: Request,
  res: Response
) => {
  const { inventoryID } = req.params
  try {
    const result = await inventoryService.deleteInventoryItem(inventoryID)

    if (result.success) {
      return res.status(200).json({ message: result.message })
    } else {
      return res.status(404).json({ message: result.message })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error deleting inventory item' })
  }
}

export const addInventoryItemController = async (
  req: Request,
  res: Response
) => {
  const { productCode, binID, quantity } = req.body

  try {
    const newItem = await inventoryService.addInventoryItemService({
      productCode,
      binID,
      quantity
    })
    return res.status(201).json(newItem)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error adding inventory item' })
  }
}

export const updateInventoryItemController = async (
  req: Request,
  res: Response
) => {
  const { inventoryID } = req.params
  const updatedFields = req.body

  try {
    const updatedItem = await inventoryService.updateInventoryItemService(
      inventoryID,
      updatedFields
    )
    if (updatedItem) {
      return res.status(200).json(updatedItem)
    } else {
      return res.status(404).json({ message: 'Inventory item not found' })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error updating inventory item' })
  }
}
