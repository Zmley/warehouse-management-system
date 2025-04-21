import { Product } from './product.model'
import { Sequelize } from 'sequelize'
import {
  getOffset,
  buildProductWhereClause,
  getTotalQuantitySubquery
} from '../../utils/productUtils'

export const getProductCodes = async (): Promise<string[]> => {
  const products = await Product.findAll({
    attributes: ['productCode'],
    raw: true
  })
  return products.map(p => p.productCode)
}

export const getProductsByWarehouse = async (
  warehouseID: string,
  keyword?: string,
  page: number = 1,
  limit: number = 10
) => {
  const offset = getOffset(page, limit)
  const whereClause = buildProductWhereClause(keyword)

  const { rows: products, count } = await Product.findAndCountAll({
    where: whereClause,
    offset,
    limit,
    order: [[Sequelize.literal('"Product"."productCode"'), 'ASC']],
    attributes: {
      include: [[getTotalQuantitySubquery(warehouseID), 'totalQuantity']]
    }
  })

  return { products, total: count }
}
