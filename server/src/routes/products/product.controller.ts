import { Request, Response } from 'express'
import * as productService from './product.service'
import { ProductUploadInput } from 'types/product'
import { asyncHandler } from 'utils/asyncHandler'
import { getLowStockProductsByWarehouseID } from './product.service'

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

///////////////////////////////////////////////////////////////////////////////////

// export const getLowStock = asyncHandler(async (req: Request, res: Response) => {
//   const warehouseID = String(req.query.warehouseID || '')
//   const page = Number(req.query.page || 1)
//   const limit = Number(req.query.limit || 100)
//   const maxQty = Number(req.query.maxQty)
//   const keyword = req.query.keyword ? String(req.query.keyword) : undefined

//   if (!warehouseID) {
//     return res
//       .status(400)
//       .json({ success: false, error: 'warehouseID required' })
//   }
//   if (!Number.isFinite(maxQty)) {
//     return res
//       .status(400)
//       .json({ success: false, error: 'maxQty required (number)' })
//   }

//   const { products, total } = await getLowStockProductsByWarehouseID(
//     warehouseID,
//     page,
//     limit,
//     maxQty,
//     keyword
//   )

//   res.status(200).json({ success: true, products, total })
// })

// test////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const getLowStock = asyncHandler(async (req: Request, res: Response) => {
  const warehouseID = String(req.query.warehouseID || '')
  const page = Number(req.query.page || 1)
  const limit = Number(req.query.limit || 100)
  const maxQty = Number(req.query.maxQty)
  const keyword = req.query.keyword ? String(req.query.keyword) : undefined
  const boxType = req.query.boxType ? String(req.query.boxType) : undefined

  if (!warehouseID) {
    return res
      .status(400)
      .json({ success: false, error: 'warehouseID required' })
  }
  if (!Number.isFinite(maxQty)) {
    return res
      .status(400)
      .json({ success: false, error: 'maxQty required (number)' })
  }

  const { products, total } = await getLowStockProductsByWarehouseID(
    warehouseID,
    page,
    limit,
    maxQty,
    keyword,
    boxType
  )

  res.status(200).json({ success: true, products, total })
})

//////////////////////////////////////////////////////////////////////////////

export const getBoxTypes = asyncHandler(async (req: Request, res: Response) => {
  const keyword =
    typeof req.query.keyword === 'string' ? req.query.keyword.trim() : undefined

  const boxTypes = await productService.getBoxTypes(keyword)

  res.status(200).json({ success: true, boxTypes })
})
