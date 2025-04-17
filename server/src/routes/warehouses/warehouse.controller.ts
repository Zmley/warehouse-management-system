import { Request, Response, NextFunction } from 'express'
import * as warehouseService from './warehouse.service'

export const getWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { warehouseID } = req.params
  try {
    const warehouse = await warehouseService.getWarehouseByID(warehouseID)
    res.status(200).json(warehouse)
  } catch (error) {
    next(error)
  }
}
export const getWarehouses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const warehouses = await warehouseService.getWarehouses()
    res.status(200).json(warehouses)
  } catch (error) {
    next(error)
  }
}
