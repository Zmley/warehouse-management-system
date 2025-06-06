import Product from 'routes/products/product.model'
import { Op, Sequelize } from 'sequelize'
import { Inventory } from 'routes/inventory/inventory.model'
import { Bin } from 'routes/bins/bin.model'
import {
  getOffset,
  buildProductWhereClause,
  handleProductInsertion
} from 'utils/product.utils'
import { ProductUploadInput } from 'types/product'
import { BinType } from 'constants/binType'
import AppError from 'utils/appError'

export const getProductCodes = async (): Promise<string[]> => {
  const products = await Product.findAll({
    attributes: ['productCode'],
    raw: true
  })
  return products.map(p => p.productCode)
}

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
        where: {
          warehouseID,
          type: {
            [Op.in]: [BinType.INVENTORY, BinType.CART]
          }
        }
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

export const addProducts = async (products: ProductUploadInput[]) => {
  const { default: pLimit } = await import('p-limit')
  const limit = pLimit(10)

  let insertedCount = 0
  let updatedCount = 0

  const tasks = products.map(item =>
    limit(() =>
      handleProductInsertion(
        item,
        () => insertedCount++,
        () => updatedCount++
      )
    )
  )

  await Promise.all(tasks)

  return {
    insertedCount,
    updatedCount
  }
}

export const getProductByBarCode = async (barCode: string) => {
  const product = await Product.findOne({
    where: { barCode }
  })

  if (!product) {
    throw new AppError(404, `❌ Product with barCode ${barCode} not found`)
  }

  return product
}
