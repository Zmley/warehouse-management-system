import { Request, Response } from 'express'
import * as warehouseService from './warehouse.service'
import { asyncHandler } from 'utils/asyncHandler'
import httpStatus from 'constants/httpStatus'

export const getWarehouse = asyncHandler(
  async (req: Request, res: Response) => {
    const { warehouseID } = req.params
    const warehouse = await warehouseService.getWarehouseByID(warehouseID)
    res.status(httpStatus.OK).json(warehouse)
  }
)

export const getWarehouses = asyncHandler(
  async (_req: Request, res: Response) => {
    const warehouses = await warehouseService.getWarehouses()
    res.status(httpStatus.OK).json(warehouses)
  }
)

export const updateWarehouse = asyncHandler(
  async (req: Request, res: Response) => {
    const { warehouseID } = req.params
    const { warehouseCode } = req.body

    const warehouse = await warehouseService.updateWarehouseCode(
      warehouseID,
      warehouseCode
    )
    res.status(httpStatus.OK).json({ success: true, warehouse })
  }
)

export const deleteWarehouse = asyncHandler(
  async (req: Request, res: Response) => {
    const { warehouseID } = req.params
    const result = await warehouseService.deleteWarehouseByID(warehouseID)
    res.status(httpStatus.OK).json(result)
  }
)

export const createWarehouse = asyncHandler(
  async (req: Request, res: Response) => {
    const { warehouseCode } = req.body

    const warehouse = await warehouseService.createWarehouse(warehouseCode)
    res.status(httpStatus.CREATED).json({ success: true, warehouse })
  }
)
