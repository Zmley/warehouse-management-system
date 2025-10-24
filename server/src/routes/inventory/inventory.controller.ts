import { Request, Response } from 'express'
import * as inventoryService from './inventory.service'
import { getBinByBinCode } from 'routes/bins/bin.service'
import { getInventoriesByBinID } from './inventory.service'
import AppError from 'utils/appError'
import httpStatus from 'constants/httpStatus'
import { asyncHandler } from 'utils/asyncHandler'

export const getInventoriesInCart = asyncHandler(
  async (_req: Request, res: Response) => {
    const cartID = res.locals.cartID
    const result = await inventoryService.getInventoriesByCartID(cartID)
    res.status(httpStatus.OK).json({ inventories: result.inventories })
  }
)

export const getInventories = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      warehouseID,
      binID,
      page,
      limit = '20',
      keyword,
      sort,
      sortBy
    } = req.query

    const parsedPage = parseInt(page as string, 10) || 1
    const parsedLimit = parseInt(limit as string, 10) || 20

    const sortParam = typeof sort === 'string' ? sort.toLowerCase() : 'desc'
    const sortOrder: 'ASC' | 'DESC' = sortParam === 'asc' ? 'ASC' : 'DESC'
    const sortField: 'binCode' | 'updatedAt' =
      sortBy === 'binCode' ? 'binCode' : 'updatedAt'

    const { inventories, totalCount } =
      await inventoryService.getInventoriesByWarehouseID(
        warehouseID as string,
        typeof binID === 'string' ? binID : undefined,
        parsedPage,
        parsedLimit,
        typeof keyword === 'string' ? keyword : undefined,
        { sortBy: sortField, sortOrder }
      )

    res.status(httpStatus.OK).json({ inventories, totalCount })
  }
)

export const deleteInventory = asyncHandler(
  async (req: Request, res: Response) => {
    const { inventoryID } = req.params
    const result = await inventoryService.deleteByInventoryID(inventoryID)
    res.status(httpStatus.OK).json({ success: true, message: result.message })
  }
)

export const updateInventories = asyncHandler(
  async (req: Request, res: Response) => {
    const { updates } = req.body
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'No updates provided',
        'VALIDATION_FAILED'
      )
    }

    const updatedItems = await inventoryService.updateByInventoryIDs(updates)
    res.status(httpStatus.OK).json({
      success: true,
      updatedItems
    })
  }
)

// export const addInventories = asyncHandler(
//   async (req: Request, res: Response) => {
//     const inventories = req.body
//     const result = await inventoryService.addInventories(inventories)
//     res.status(httpStatus.OK).json({
//       success: true,
//       insertedCount: result.insertedCount,
//       updatedCount: result.updatedCount
//     })
//   }
// )

export const addInventories = asyncHandler(
  async (req: Request, res: Response) => {
    const inventories = req.body

    if (!Array.isArray(inventories) || inventories.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Inventory list is empty or invalid'
      })
    }

    const first = inventories[0]
    const isBinIDMode =
      typeof first.binID === 'string' && first.binID.trim() !== ''

    const result = isBinIDMode
      ? await inventoryService.addInventoriesByBinID(inventories)
      : await inventoryService.addInventories(inventories)

    const insertedCount = result.insertedCount ?? 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedCount = (result as any).updatedCount ?? 0

    res.status(httpStatus.OK).json({
      success: true,
      insertedCount,
      updatedCount
    })
  }
)

export const getInventoriesByBinCode = asyncHandler(
  async (req: Request, res: Response) => {
    const { binCode } = req.params
    if (!binCode || typeof binCode !== 'string') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        '❌ binCode must be provided as a path param',
        'INVALID_BIN_CODE'
      )
    }

    const bin = await getBinByBinCode(binCode)
    const inventories = await getInventoriesByBinID(bin.binID)

    res.status(httpStatus.OK).json({ success: true, inventories })
  }
)
