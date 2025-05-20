import { Request, Response, NextFunction } from 'express'
import * as productService from './product.service'
import { ProductUploadInput } from 'types/product'

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
      page,
      limit,
      keyword
    )

    res.status(200).json({ success: true, products, total })
  } catch (error) {
    next(error)
  }
}

export const addProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products: ProductUploadInput[] = req.body

    if (!Array.isArray(products)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid payload' })
    }

    const result = await productService.addProducts(products)

    return res.status(200).json({ success: true, result })
  } catch (error) {
    next(error)
  }
}

export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { barCode } = req.query
    if (!barCode || typeof barCode !== 'string') {
      throw new Error('❌ Missing or invalid barCode in query')
    }

    const product = await productService.getProductByBarCode(barCode)
    res.json({ success: true, product })
  } catch (err) {
    next(err)
  }
}
