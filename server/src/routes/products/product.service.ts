import { Product } from './product.model'
import { Sequelize } from 'sequelize'
import { Inventory } from 'routes/inventory/inventory.model'
import { Bin } from 'routes/bins/bin.model'
import { getOffset, buildProductWhereClause } from 'utils/productUtils'
import { ProductUploadInput } from 'types/product'
import AppError from 'utils/appError'

export const getProductCodes = async (): Promise<string[]> => {
  const products = await Product.findAll({
    attributes: ['productCode'],
    raw: true
  })
  return products.map(p => p.productCode)
}

//get products and each product's total quantity in this warehouse
export const getProductsByWarehouseID = async (
  warehouseID: string,
  page: number,
  limit: number,
  keyword?: string
) => {
  const offset = getOffset(page, limit)
  const whereClause = buildProductWhereClause(keyword)

  const { rows, count } = await Inventory.findAndCountAll({
    attributes: [
      'productCode',
      [Sequelize.fn('SUM', Sequelize.col('quantity')), 'quantity']
    ],
    include: [
      {
        model: Bin,
        as: 'bin',
        attributes: [],
        where: { warehouseID }
      },
      {
        model: Product,
        as: 'product',
        attributes: ['barCode', 'boxType', 'createdAt'],
        where: whereClause
      }
    ],
    group: [
      'Inventory.productCode',
      'product.barCode',
      'product.boxType',
      'product.createdAt'
    ],
    order: [['productCode', 'ASC']],
    offset,
    limit,
    raw: true
  })

  const products = rows.map(row => ({
    productCode: row.productCode,
    totalQuantity: row.quantity,
    barCode: row['product.barCode'],
    boxType: row['product.boxType'],
    createdAt: row['product.createdAt']
  }))

  return {
    products,
    total: count.length
  }
}

import { chunk } from 'lodash'

export const uploadProducts = async (products: ProductUploadInput[]) => {
  const skipped: ProductUploadInput[] = []
  let insertedCount = 0

  const BATCH_SIZE = 200
  const chunks = chunk(products, BATCH_SIZE)

  for (const batch of chunks) {
    await Promise.all(
      batch.map(async item => {
        const cleanProductCode = item.productCode?.trim()
        const cleanBarCode = item.barCode?.trim()
        const cleanBoxType = item.boxType?.trim()

        if (!cleanProductCode) {
          skipped.push(item)
          return
        }

        try {
          await Product.create({
            productCode: cleanProductCode,
            barCode: cleanBarCode,
            boxType: cleanBoxType
          })
          insertedCount++
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            skipped.push(item)
          } else {
            throw new AppError(
              500,
              error instanceof Error ? error.message : 'Unknown error'
            )
          }
        }
      })
    )
  }

  return {
    insertedCount,
    skippedCount: skipped.length
  }
}
