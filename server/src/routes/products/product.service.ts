import { Product } from './product.model'
import { Op, Sequelize } from 'sequelize'
import { Inventory } from 'routes/inventory/inventory.model'
import { Bin } from 'routes/bins/bin.model'
import { getOffset, buildProductWhereClause } from 'utils/productUtils'
import { ProductUploadInput } from 'interfaces/product'

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

export const uploadProducts = async (products: ProductUploadInput[]) => {
  const incomingCodes = products.map(p => p.productCode)

  const existing = await Product.findAll({
    where: {
      productCode: {
        [Op.in]: incomingCodes
      }
    },
    attributes: ['productCode']
  })

  const existingCodes = existing.map(p => p.productCode)

  const newProducts = products.filter(
    p => !existingCodes.includes(p.productCode)
  )

  const created = await Product.bulkCreate(
    newProducts.map(p => ({
      productCode: p.productCode,
      barCode: p.barCode,
      boxType: p.boxType
    }))
  )

  return {
    insertedCount: created.length,
    skippedCount: existingCodes.length,
    duplicatedProductCodes: existingCodes
  }
}
