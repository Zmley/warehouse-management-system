import { Request, Response, NextFunction } from 'express'
import * as productService from './product.service'

export const getProductCodes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productCodes = await productService.getProductCodes()
    res.status(200).json({ success: true, productCodes })
  } catch (error) {
    next(error)
  }
}

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const warehouseID = req.query.warehouseID as string
    const keyword = req.query.keyword?.toString()
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10

    const { products, total } = await productService.getProductsByWarehouseID(
      warehouseID,
      keyword,
      page,
      limit
    )

    res.status(200).json({ success: true, products, total })
  } catch (error) {
    next(error)
  }
}
