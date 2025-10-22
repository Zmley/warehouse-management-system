import Product from 'routes/products/product.model'
import { literal, Op, Sequelize, WhereOptions } from 'sequelize'
import { Inventory } from 'routes/inventory/inventory.model'
import { Bin } from 'routes/bins/bin.model'
import {
  getOffset,
  buildProductWhereClause,
  handleProductInsertion,
  buildProductOrderClause,
  PRODUCT_GROUP,
  ProductLowRowPlain
} from 'utils/product.utils'
import { ProductUploadInput } from 'types/product'
import { BinType } from 'constants/index'
import AppError from 'utils/appError'
import { sequelize } from 'config/db'

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

  const { rows: prodRows, count } = await Product.findAndCountAll({
    attributes: ['productCode', 'barCode', 'boxType', 'createdAt'],
    where: whereClause,
    order: buildProductOrderClause(),
    offset,
    limit
  })

  type ProductPlain = {
    productCode: string
    barCode: string
    boxType: string
    createdAt: Date
  }

  const prodPlain: ProductPlain[] = prodRows.map(
    r => r.get({ plain: true }) as ProductPlain
  )
  const productCodes: string[] = prodPlain.map(p => p.productCode)

  type InvAgg = { productCode: string; quantity: string | number }

  let quantityMap: Record<string, number> = Object.create(null)

  if (productCodes.length > 0) {
    const invRows = (await Inventory.findAll({
      attributes: [
        'productCode',
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'quantity']
      ],
      where: {
        productCode: { [Op.in]: productCodes }
      },
      include: [
        {
          model: Bin,
          as: 'bin',
          attributes: [],
          required: true,
          where: {
            warehouseID,
            type: { [Op.in]: [BinType.INVENTORY] }
          }
        }
      ],
      group: ['Inventory.productCode'],
      raw: true
    })) as InvAgg[]

    quantityMap = invRows.reduce<Record<string, number>>((acc, r) => {
      acc[r.productCode] = Number(r.quantity) || 0
      return acc
    }, Object.create(null))
  }

  const products = prodPlain.map(p => ({
    productCode: p.productCode,
    totalQuantity: quantityMap[p.productCode] ?? 0,
    barCode: p.barCode,
    boxType: p.boxType,
    createdAt: p.createdAt
  }))

  return {
    products,
    total: count
  }
}

export interface BoxUploadInput {
  productCode: string
  barCode: string
  boxType: string
}

export const addProducts = async (products: ProductUploadInput[]) => {
  let insertedCount = 0
  let updatedCount = 0

  const BATCH_SIZE = 10
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(item =>
        handleProductInsertion(
          item,
          () => insertedCount++,
          () => updatedCount++
        )
      )
    )
  }

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

  const productCode = product.productCode

  const candidateBins = await Bin.findAll({
    where: {
      defaultProductCodes: {
        [Op.like]: `%${productCode}%`
      }
    },
    attributes: ['binCode', 'defaultProductCodes']
  })

  const matchedBin = candidateBins.find(bin => {
    const codes = bin.defaultProductCodes?.split(',').map(c => c.trim()) || []
    return codes.includes(productCode)
  })

  const binCode = matchedBin?.binCode ?? null

  return {
    ...product.toJSON(),
    binCode
  }
}

export const getProductByProductCode = async (productCode: string) => {
  const product = await Product.findOne({
    where: { productCode }
  })

  if (!product) {
    throw new AppError(
      404,
      `❌ Product with productCode ${productCode} not found`
    )
  }

  const candidateBins = await Bin.findAll({
    where: {
      defaultProductCodes: {
        [Op.like]: `%${productCode}%`
      }
    },
    attributes: ['binCode', 'defaultProductCodes']
  })

  const matchedBin = candidateBins.find(bin => {
    const codes = bin.defaultProductCodes?.split(',').map(c => c.trim()) || []
    return codes.includes(productCode)
  })

  const binCode = matchedBin?.binCode ?? null

  return {
    ...product.toJSON(),
    binCode
  }
}

const PRODUCT_ATTRS = [
  'productID',
  'productCode',
  'barCode',
  'boxType',
  'createdAt'
] as const

const INVENTORY_INCLUDE = (warehouseID: string) => [
  {
    model: Inventory,
    as: 'inventories',
    attributes: [],
    required: false,
    include: [
      {
        model: Bin,
        as: 'bin',
        attributes: [],
        required: false,
        where: { warehouseID, type: { [Op.in]: [BinType.INVENTORY] } }
      }
    ]
  }
]

////////

// export const getLowStockProductsByWarehouseID = async (
//   warehouseID: string,
//   page: number,
//   limit: number,
//   maxQty: number,
//   keyword?: string,
//   boxType?: string
// ) => {
//   const offset = getOffset(page, limit)

//   const where: WhereOptions<Product> = {
//     ...(buildProductWhereClause(keyword) as WhereOptions<Product>),
//     ...(boxType?.trim() ? { boxType: { [Op.iLike]: boxType.trim() } } : {})
//   }

//   const qtyAgg = Sequelize.fn(
//     'COALESCE',
//     Sequelize.fn('SUM', Sequelize.col('inventories.quantity')),
//     0
//   )
//   const having =
//     Number(maxQty) === 0
//       ? Sequelize.where(qtyAgg, Op.eq, 0)
//       : Sequelize.where(qtyAgg, Op.lte, Number(maxQty))

//   const { rows, count } = await Product.findAndCountAll({
//     attributes: [...PRODUCT_ATTRS, [qtyAgg, 'totalQuantity']],
//     where,
//     include: INVENTORY_INCLUDE(warehouseID),
//     group: PRODUCT_GROUP as unknown as string[],
//     having,
//     order: buildProductOrderClause(),
//     limit,
//     offset,
//     subQuery: false
//   })

//   const total = Array.isArray(count) ? count.length : (count as number)

//   const products = rows.map(r => {
//     const p = r.get({ plain: true }) as ProductLowRowPlain
//     return {
//       productCode: p.productCode,
//       totalQuantity: Number(p.totalQuantity ?? 0),
//       barCode: p.barCode,
//       boxType: p.boxType,
//       createdAt: p.createdAt
//     }
//   })

//   return { products, total }
// }

export const getLowStockProductsByWarehouseID = async (
  warehouseID: string,
  page: number,
  limit: number,
  maxQty: number,
  keyword?: string,
  boxType?: string
) => {
  const offset = getOffset(page, limit)

  const where: WhereOptions<Product> = {
    ...(buildProductWhereClause(keyword) as WhereOptions<Product>),
    ...(boxType?.trim() ? { boxType: { [Op.iLike]: boxType.trim() } } : {})
  }

  // ✅ 仅统计当前仓库 & INVENTORY 类型的库存
  const wh = sequelize.escape(warehouseID) // 防止 SQL 注入并正确加引号
  const qtyAggSql = `
    COALESCE(
      SUM(
        CASE
          WHEN "inventories->bin"."warehouseID" = ${wh}
           AND "inventories->bin"."type" = 'INVENTORY'
          THEN "inventories"."quantity"
          ELSE 0
        END
      ),
      0
    )
  `
  const qtyAgg = literal(qtyAggSql)

  const having =
    Number(maxQty) === 0
      ? Sequelize.where(literal(qtyAggSql), Op.eq, 0)
      : Sequelize.where(literal(qtyAggSql), Op.lte, Number(maxQty))

  const { rows, count } = await Product.findAndCountAll({
    attributes: [...PRODUCT_ATTRS, [qtyAgg, 'totalQuantity']], // ← 只改这里的聚合
    where,
    include: INVENTORY_INCLUDE(warehouseID), // ← 保持不变
    group: PRODUCT_GROUP as unknown as string[],
    having,
    order: buildProductOrderClause(),
    limit,
    offset,
    subQuery: false
  })

  const total = Array.isArray(count) ? count.length : (count as number)

  const products = rows.map(r => {
    const p = r.get({ plain: true }) as ProductLowRowPlain
    return {
      productCode: p.productCode,
      totalQuantity: Number(p.totalQuantity ?? 0),
      barCode: p.barCode,
      boxType: p.boxType,
      createdAt: p.createdAt
    }
  })

  return { products, total }
}

export const getBoxTypes = async (keyword?: string): Promise<string[]> => {
  const where = keyword
    ? { boxType: { [Op.iLike]: `%${keyword.trim()}%` } }
    : { boxType: { [Op.ne]: null } }

  const rows = await Product.findAll({
    attributes: [
      [Sequelize.fn('DISTINCT', Sequelize.col('boxType')), 'boxType']
    ],
    where,
    order: [[Sequelize.col('boxType'), 'ASC']],
    raw: true
  })

  return rows.map(r => (r.boxType ?? '').trim()).filter(bt => bt.length > 0)
}
