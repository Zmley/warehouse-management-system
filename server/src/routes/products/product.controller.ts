import { Request, Response } from 'express'
import * as productService from './product.service'
import { ProductUploadInput } from 'types/product'
import { asyncHandler } from 'utils/asyncHandler'

export const getProductCodes = asyncHandler(
  async (_req: Request, res: Response) => {
    const productCodes = await productService.getProductCodes()
    res.status(200).json({ success: true, productCodes })
  }
)

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
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
})

export const addProducts = asyncHandler(async (req: Request, res: Response) => {
  const products: ProductUploadInput[] = req.body
  const result = await productService.addProducts(products)
  res.status(200).json({ success: true, result })
})

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const barCode = req.query.barCode as string
  const productCode = (req.query.productCode as string) || barCode

  let product
  try {
    product = await productService.getProductByBarCode(barCode)
  } catch {
    product = await productService.getProductByProductCode(productCode)
  }

  res.status(200).json({ success: true, product })
})
