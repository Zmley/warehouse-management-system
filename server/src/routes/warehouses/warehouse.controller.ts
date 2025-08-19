import { Request, Response } from 'express'
import * as warehouseService from './warehouse.service'
import { asyncHandler } from 'utils/asyncHandler'
import httpStatus from 'constants/httpStatus'

export const getWarehouse = asyncHandler(
  async (req: Request, res: Response) => {
    const { warehouseID } = req.params
    const warehouse = await warehouseService.getWarehouseByID(warehouseID)
    res.status(httpStatus.OK).json({ success: true, warehouse })
  }
)

export const getWarehouses = asyncHandler(
  async (_req: Request, res: Response) => {
    const warehouses = await warehouseService.getWarehouses()
    res.status(httpStatus.OK).json({ success: true, warehouses })
  }
)
