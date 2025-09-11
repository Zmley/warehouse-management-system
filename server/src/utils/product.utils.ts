import { Op, Sequelize } from 'sequelize'
import type { Order, OrderItem, WhereOptions } from 'sequelize'

import { ProductUploadInput } from 'types/product'
import Product from 'routes/products/product.model'
import AppError from './appError'

export const getOffset = (page: number, limit: number): number => {
  return (page - 1) * limit
}

export const buildProductWhereClause = (keyword?: string): WhereOptions => {
  if (keyword) {
    return {
      productCode: {
        [Op.iLike]: `%${keyword}%`
      }
    }
  }
  return {}
}

export const sanitizeProductItem = (item: ProductUploadInput) => {
  return {
    productCode: item.productCode?.trim(),
    barCode: item.barCode?.trim(),
    boxType: item.boxType?.trim()
  }
}

export const handleProductInsertion = async (
  item: ProductUploadInput,
  incrementInserted: () => void,
  incrementUpdated: () => void
) => {
  const { productCode, barCode, boxType } = sanitizeProductItem(item)

  if (!productCode) return

  try {
    await Product.create({ productCode, barCode, boxType })
    incrementInserted()
  } catch (error) {
    if (
      error.name === 'SequelizeUniqueConstraintError' ||
      error.original?.code === '23505'
    ) {
      const [affectedCount] = await Product.update(
        { barCode, boxType },
        { where: { productCode } }
      )

      if (affectedCount > 0) {
        incrementUpdated()
      } else {
        throw new AppError(500, `⚠️ Failed to update product: ${productCode}`)
      }
    } else {
      throw new AppError(
        500,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
}

const orderLenBucket = Sequelize.literal(`
  CASE
    WHEN char_length("Product"."productCode") = 8 THEN 0
    WHEN char_length("Product"."productCode") = 7 THEN 1
    WHEN char_length("Product"."productCode") = 6 THEN 2
    ELSE 3
  END
`)

const orderStartDigit = Sequelize.literal(`
  CASE WHEN "Product"."productCode" ~ '^[0-9]' THEN 0 ELSE 1 END
`)

const orderNumeric = Sequelize.literal(`
  NULLIF(regexp_replace("Product"."productCode", '[^0-9]', '', 'g'), '')::bigint
`)

const orderSuffix = Sequelize.literal(`
  COALESCE(SUBSTRING("Product"."productCode" FROM '([A-Za-z]+)$'), '')
`)

export function buildProductOrderClause(): Order {
  const order: OrderItem[] = [
    [orderLenBucket, 'ASC'],
    [orderStartDigit, 'ASC'],
    [orderNumeric, 'ASC'],
    [orderSuffix, 'ASC'],
    ['productID', 'ASC']
  ]
  return order
}

export const PRODUCT_GROUP = [
  'Product.productID',
  'Product.productCode',
  'Product.barCode',
  'Product.boxType',
  'Product.createdAt'
] as const

export type ProductLowRowPlain = {
  productID: string
  productCode: string
  barCode: string | null
  boxType: string | null
  createdAt: Date
  totalQuantity: number | string | null
}
