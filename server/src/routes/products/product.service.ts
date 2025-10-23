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
import Warehouse from 'routes/warehouses/warehouse.model'
import Transfer from 'routes/transfers/transfer.model'
import Task from 'routes/tasks/task.model'

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

  const wh = sequelize.escape(warehouseID)
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
    attributes: [...PRODUCT_ATTRS, [qtyAgg, 'totalQuantity']],
    where,
    include: INVENTORY_INCLUDE(warehouseID),
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

////////////////////////

// const PRODUCT_ATTRS = [
//   [Sequelize.col('Product.productCode'), 'productCode'],
//   [Sequelize.col('Product.barCode'), 'barCode'],
//   [Sequelize.col('Product.boxType'), 'boxType'],
//   [Sequelize.col('Product.createdAt'), 'createdAt']
// ]

// const PRODUCT_GROUP = [
//   'Product.productCode',
//   'Product.barCode',
//   'Product.boxType',
//   'Product.createdAt'
// ]

// const INVENTORY_INCLUDE = (warehouseID: string) => [
//   {
//     model: Inventory,
//     as: 'inventories',
//     required: false,
//     attributes: [],
//     include: [
//       {
//         model: Bin,
//         as: 'bin',
//         required: true,
//         attributes: [],
//         where: {
//           warehouseID,
//           type: BinType.INVENTORY
//         }
//       }
//     ]
//   }
// ]

// === NEW: 专看“低库存 + 其他仓有货”（不分页，复用现有常量/工具） ===

// === NEW: 专看“低库存 + 其他仓有货”（不分页，复用现有常量/工具） ===
// export const getLowStockWithOtherWarehouses = async (
//   warehouseID: string,
//   maxQty: number,
//   keyword?: string,
//   boxType?: string
// ) => {
//   const where: WhereOptions<Product> = {
//     ...(buildProductWhereClause(keyword) as WhereOptions<Product>),
//     ...(boxType?.trim()
//       ? { boxType: { [Op.iLike]: `%${boxType.trim()}%` } }
//       : {})
//   }

//   const wh = sequelize.escape(warehouseID)
//   const qtyAggSql = `
//     COALESCE(
//       SUM(
//         CASE
//           WHEN "inventories->bin"."warehouseID" = ${wh}
//            AND "inventories->bin"."type" = 'INVENTORY'
//           THEN "inventories"."quantity"
//           ELSE 0
//         END
//       ),
//       0
//     )
//   `
//   const qtyAgg = literal(qtyAggSql)

//   const otherQtySql = `
//     COALESCE((
//       SELECT SUM(i."quantity")
//       FROM "inventory" i
//       JOIN "bin" b ON b."binID" = i."binID"
//       WHERE i."productCode" = "Product"."productCode"
//         AND i."quantity" > 0
//         AND b."type" = 'INVENTORY'
//         AND b."warehouseID" <> ${wh}
//     ), 0)
//   `
//   const otherQty = literal(otherQtySql)

//   const having: any = {
//     [Op.and]: [
//       Sequelize.where(otherQty, { [Op.gt]: 0 }),
//       Number(maxQty) === 0
//         ? Sequelize.where(literal(qtyAggSql), { [Op.eq]: 0 })
//         : Sequelize.where(literal(qtyAggSql), { [Op.lte]: Number(maxQty) })
//     ]
//   }

//   const rows = await Product.findAll({
//     attributes: [...PRODUCT_ATTRS, [qtyAgg, 'totalQuantity']],
//     where,
//     include: INVENTORY_INCLUDE(warehouseID),
//     group: PRODUCT_GROUP as unknown as string[],
//     having,
//     order: buildProductOrderClause(),
//     subQuery: false
//   })

//   const pageProducts = rows.map(
//     r => r.get({ plain: true }) as ProductLowRowPlain
//   )
//   const productCodes = pageProducts.map(p => p.productCode)
//   if (productCodes.length === 0) return { products: [] }

//   const otherInvRows = await Inventory.findAll({
//     attributes: ['inventoryID', 'productCode', 'quantity'],
//     where: {
//       productCode: { [Op.in]: productCodes },
//       quantity: { [Op.gt]: 0 }
//     },
//     include: [
//       {
//         model: Bin,
//         as: 'bin',
//         attributes: ['binID', 'binCode', 'warehouseID', 'type'],
//         required: true,
//         where: {
//           warehouseID: { [Op.ne]: warehouseID },
//           type: BinType.INVENTORY
//         },
//         include: [
//           {
//             model: Warehouse,
//             as: 'warehouse',
//             attributes: ['warehouseID', 'warehouseCode'],
//             required: false
//           },
//           {
//             model: Inventory,
//             as: 'inventories',
//             required: false,
//             attributes: ['inventoryID', 'productCode', 'quantity', 'binID'],
//             where: { quantity: { [Op.gt]: 0 } }
//           }
//         ]
//       }
//     ],
//     raw: false
//   })

//   type OtherInv = {
//     inventoryID: string
//     productCode?: string
//     quantity: number
//     bin?: {
//       binID?: string
//       binCode?: string
//       warehouseID?: string
//       warehouse?: { warehouseID?: string; warehouseCode?: string }
//       inventories?: Array<{
//         inventoryID: string
//         productCode: string
//         quantity: number
//         binID?: string
//       }>
//     }
//   }

//   const otherByProduct = new Map<string, OtherInv[]>()

//   for (const inv of otherInvRows as any[]) {
//     const pcode = inv.get('productCode') as string
//     const bin = inv.get('bin') as any
//     const binInventories = (bin?.inventories || []).map((x: any) => ({
//       inventoryID: x.get?.('inventoryID') ?? x.inventoryID,
//       productCode: x.get?.('productCode') ?? x.productCode,
//       quantity: Number(x.get?.('quantity') ?? x.quantity ?? 0),
//       binID: x.get?.('binID') ?? x.binID
//     }))

//     const one: OtherInv = {
//       inventoryID: inv.get('inventoryID'),
//       productCode: pcode,
//       quantity: Number(inv.get('quantity') ?? 0),
//       bin: {
//         binID: bin?.get?.('binID') ?? bin?.binID,
//         binCode: bin?.get?.('binCode') ?? bin?.binCode,
//         warehouseID: bin?.get?.('warehouseID') ?? bin?.warehouseID,
//         warehouse: bin?.warehouse
//           ? {
//               warehouseID:
//                 bin.warehouse.get?.('warehouseID') ?? bin.warehouse.warehouseID,
//               warehouseCode:
//                 bin.warehouse.get?.('warehouseCode') ??
//                 bin.warehouse.warehouseCode
//             }
//           : undefined,
//         inventories: binInventories
//       }
//     }

//     if (!otherByProduct.has(pcode)) otherByProduct.set(pcode, [])
//     otherByProduct.get(pcode)!.push(one)
//   }

//   // =========================
//   // NEW：转运任务聚合（按产品）
//   // =========================
//   // 仅看“目标仓 = 当前仓库”的 Transfer
//   const transferRows = await Transfer.findAll({
//     attributes: ['productCode', 'status'],
//     where: {
//       destinationWarehouseID: warehouseID,
//       productCode: { [Op.in]: productCodes },
//       status: {
//         [Op.in]: [
//           TaskStatus.PENDING,
//           TaskStatus.IN_PROCESS,
//           TaskStatus.COMPLETED
//         ]
//       }
//     },
//     raw: true
//   })

//   type TransStat = {
//     transfersCount: number
//     hasPendingTransfer: boolean
//     transferStatus?: TaskStatus // 取优先级最高的一个
//   }

//   const statusRank: Record<string, number> = {
//     [TaskStatus.IN_PROCESS]: 3,
//     [TaskStatus.PENDING]: 2,
//     [TaskStatus.COMPLETED]: 1
//   }

//   const transByProduct = new Map<string, TransStat>()
//   for (const r of transferRows as Array<{
//     productCode: string
//     status: TaskStatus
//   }>) {
//     const key = r.productCode
//     const cur = transByProduct.get(key) || {
//       transfersCount: 0,
//       hasPendingTransfer: false,
//       transferStatus: undefined as TaskStatus | undefined
//     }
//     cur.transfersCount += 1
//     if (r.status === TaskStatus.PENDING) cur.hasPendingTransfer = true

//     if (!cur.transferStatus) {
//       cur.transferStatus = r.status
//     } else {
//       const curRank = statusRank[cur.transferStatus] ?? 0
//       const nxtRank = statusRank[r.status] ?? 0
//       if (nxtRank > curRank) cur.transferStatus = r.status
//     }
//     transByProduct.set(key, cur)
//   }

//   // 组装返回
//   const products = pageProducts
//     .map(p => {
//       const trans = transByProduct.get(p.productCode)
//       return {
//         productCode: p.productCode,
//         totalQuantity: Number(p.totalQuantity ?? 0),
//         barCode: p.barCode,
//         boxType: p.boxType,
//         createdAt: p.createdAt,
//         otherInventories: otherByProduct.get(p.productCode) ?? [],
//         // ⬇︎ 新增三个字段（供前端 Low/Out-of-stock 共用）
//         hasPendingTransfer: !!trans?.hasPendingTransfer,
//         transferStatus: trans?.transferStatus ?? null,
//         transfersCount: trans?.transfersCount ?? 0
//       }
//     })
//     .filter(p => (p.otherInventories?.length ?? 0) > 0)

//   return { products }
// }

////////////////////////

// === NEW: 专看“低库存 + 其他仓有货”（不分页，复用现有常量/工具） ===
// export const getLowStockWithOtherWarehouses = async (
//   warehouseID: string,
//   maxQty: number,
//   keyword?: string,
//   boxType?: string
// ) => {
//   // 1) 产品基础筛选（复用你们的工具）
//   const where: WhereOptions<Product> = {
//     ...(buildProductWhereClause(keyword) as WhereOptions<Product>),
//     ...(boxType?.trim()
//       ? { boxType: { [Op.iLike]: `%${boxType.trim()}%` } }
//       : {})
//   }

//   // 当前仓数量聚合
//   const wh = sequelize.escape(warehouseID)
//   const qtyAggSql = `
//     COALESCE(
//       SUM(
//         CASE
//           WHEN "inventories->bin"."warehouseID" = ${wh}
//            AND "inventories->bin"."type" = 'INVENTORY'
//           THEN "inventories"."quantity"
//           ELSE 0
//         END
//       ),
//       0
//     )
//   `
//   const qtyAgg = literal(qtyAggSql)

//   // 他仓数量（同款）合计（>0）
//   const otherQtySql = `
//     COALESCE((
//       SELECT SUM(i."quantity")
//       FROM "inventory" i
//       JOIN "bin" b ON b."binID" = i."binID"
//       WHERE i."productCode" = "Product"."productCode"
//         AND i."quantity" > 0
//         AND b."type" = 'INVENTORY'
//         AND b."warehouseID" <> ${wh}
//     ), 0)
//   `
//   const otherQty = literal(otherQtySql)

//   const having: any = {
//     [Op.and]: [
//       Sequelize.where(otherQty, { [Op.gt]: 0 }),
//       Number(maxQty) === 0
//         ? Sequelize.where(literal(qtyAggSql), { [Op.eq]: 0 })
//         : Sequelize.where(literal(qtyAggSql), { [Op.lte]: Number(maxQty) })
//     ]
//   }

//   // 2) 一次性查出满足条件的产品
//   const rows = await Product.findAll({
//     attributes: [...PRODUCT_ATTRS, [qtyAgg, 'totalQuantity']],
//     where,
//     include: INVENTORY_INCLUDE(warehouseID), // 仅挂当前仓的库存用于聚合
//     group: PRODUCT_GROUP as unknown as string[],
//     having,
//     order: buildProductOrderClause(),
//     subQuery: false
//   })

//   const pageProducts = rows.map(
//     r => r.get({ plain: true }) as ProductLowRowPlain
//   )
//   const productCodes = pageProducts.map(p => p.productCode)
//   if (productCodes.length === 0) return { products: [] }

//   // 3) 拉取这些产品在“其他仓”的库存（>0），并把该 bin 的整格库存带出来
//   const otherInvRows = await Inventory.findAll({
//     attributes: ['inventoryID', 'productCode', 'quantity'],
//     where: {
//       productCode: { [Op.in]: productCodes },
//       quantity: { [Op.gt]: 0 }
//     },
//     include: [
//       {
//         model: Bin,
//         as: 'bin',
//         attributes: ['binID', 'binCode', 'warehouseID', 'type'],
//         required: true,
//         where: {
//           warehouseID: { [Op.ne]: warehouseID },
//           type: BinType.INVENTORY
//         },
//         include: [
//           {
//             model: Warehouse,
//             as: 'warehouse',
//             attributes: ['warehouseID', 'warehouseCode'],
//             required: false
//           },
//           {
//             model: Inventory,
//             as: 'inventories', // ⚠️ 与 Bin->Inventory 的别名保持一致
//             required: false,
//             attributes: ['inventoryID', 'productCode', 'quantity', 'binID'],
//             where: { quantity: { [Op.gt]: 0 } }
//           }
//         ]
//       }
//     ],
//     raw: false
//   })

//   type OtherInv = {
//     inventoryID: string
//     productCode?: string
//     quantity: number
//     bin?: {
//       binID?: string
//       binCode?: string
//       warehouseID?: string
//       warehouse?: { warehouseID?: string; warehouseCode?: string }
//       inventories?: Array<{
//         inventoryID: string
//         productCode: string
//         quantity: number
//         binID?: string
//       }>
//     }
//   }

//   const otherByProduct = new Map<string, OtherInv[]>()

//   for (const inv of otherInvRows as any[]) {
//     const pcode = inv.get('productCode') as string
//     const bin = inv.get('bin') as any

//     const binInventories = (bin?.inventories || []).map((x: any) => ({
//       inventoryID: x.get?.('inventoryID') ?? x.inventoryID,
//       productCode: x.get?.('productCode') ?? x.productCode,
//       quantity: Number(x.get?.('quantity') ?? x.quantity ?? 0),
//       binID: x.get?.('binID') ?? x.binID
//     }))

//     const one: OtherInv = {
//       inventoryID: inv.get('inventoryID'),
//       productCode: pcode,
//       quantity: Number(inv.get('quantity') ?? 0),
//       bin: {
//         binID: bin?.get?.('binID') ?? bin?.binID,
//         binCode: bin?.get?.('binCode') ?? bin?.binCode,
//         warehouseID: bin?.get?.('warehouseID') ?? bin?.warehouseID,
//         warehouse: bin?.warehouse
//           ? {
//               warehouseID:
//                 bin.warehouse.get?.('warehouseID') ?? bin.warehouse.warehouseID,
//               warehouseCode:
//                 bin.warehouse.get?.('warehouseCode') ??
//                 bin.warehouse.warehouseCode
//             }
//           : undefined,
//         inventories: binInventories
//       }
//     }

//     if (!otherByProduct.has(pcode)) otherByProduct.set(pcode, [])
//     otherByProduct.get(pcode)!.push(one)
//   }

//   // 4) 汇总 Transfer（按 productCode）
//   //    只看 destinationWarehouseID = 当前仓 的记录
//   const transferRows = await Transfer.findAll({
//     attributes: ['productCode', 'status'],
//     where: {
//       destinationWarehouseID: warehouseID,
//       productCode: { [Op.in]: productCodes },
//       status: { [Op.in]: ['PENDING', 'IN_PROCESS', 'COMPLETED'] }
//     },
//     raw: true
//   })

//   type TransStat = {
//     transfersCount: number
//     hasPendingTransfer: boolean
//     transferStatus?: 'PENDING' | 'IN_PROCESS' | 'COMPLETED'
//   }

//   const statusRank: Record<string, number> = {
//     IN_PROCESS: 3,
//     PENDING: 2,
//     COMPLETED: 1
//   }

//   const transByProduct = new Map<string, TransStat>()
//   for (const r of transferRows as Array<{
//     productCode: string
//     status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED'
//   }>) {
//     const key = r.productCode
//     const cur = transByProduct.get(key) || {
//       transfersCount: 0,
//       hasPendingTransfer: false,
//       transferStatus: undefined as TransStat['transferStatus']
//     }
//     cur.transfersCount += 1
//     if (r.status === 'PENDING') cur.hasPendingTransfer = true

//     if (!cur.transferStatus) {
//       cur.transferStatus = r.status
//     } else {
//       const curRank = statusRank[cur.transferStatus] ?? 0
//       const nxtRank = statusRank[r.status] ?? 0
//       if (nxtRank > curRank) cur.transferStatus = r.status
//     }
//     transByProduct.set(key, cur)
//   }

//   // 5) 汇总缺货任务（Out-of-Stock Task），返回 taskID（无则 null）
//   const hasAttr = (model: any, attr: string) => !!model?.rawAttributes?.[attr]

//   // 基础 where：只看 PENDING
//   const oosWhere: any = {
//     productCode: { [Op.in]: productCodes },
//     status: 'PENDING'
//     // 如有类型字段：type: 'OUT_OF_STOCK'
//   }
//   const oosInclude: any[] = []

//   // 自适应“按仓过滤”的字段
//   if (hasAttr(Task, 'warehouseID')) {
//     oosWhere.warehouseID = warehouseID
//   } else if (hasAttr(Task, 'destinationWarehouseID')) {
//     oosWhere.destinationWarehouseID = warehouseID
//   } else if (hasAttr(Task, 'destinationBinID')) {
//     // 通过 join 目的 bin 的 warehouseID 过滤
//     oosInclude.push({
//       model: Bin,
//       as: 'destinationBin', // ⚠️ 若别名不同请修改
//       attributes: [],
//       required: true,
//       where: { warehouseID }
//     })
//   } // 否则无法按仓过滤，就不加（避免报错）

//   const oosTaskRows = await Task.findAll({
//     attributes: ['productCode', 'taskID'],
//     where: oosWhere,
//     include: oosInclude,
//     raw: true
//   })

//   // productCode -> 某个 pending 缺货任务的 taskID（取第一条即可）
//   const pendingOosMap = new Map<string, string | null>()
//   for (const r of oosTaskRows as Array<{
//     productCode: string
//     taskID: string
//   }>) {
//     if (r.productCode && !pendingOosMap.has(r.productCode)) {
//       pendingOosMap.set(r.productCode, r.taskID)
//     }
//   }

//   // 6) 组装返回
//   const products = pageProducts
//     .map(p => {
//       const trans = transByProduct.get(p.productCode)
//       return {
//         productCode: p.productCode,
//         totalQuantity: Number(p.totalQuantity ?? 0),
//         barCode: p.barCode,
//         boxType: p.boxType,
//         createdAt: p.createdAt,
//         otherInventories: otherByProduct.get(p.productCode) ?? [],
//         // 转运任务聚合
//         hasPendingTransfer: !!trans?.hasPendingTransfer,
//         transferStatus: trans?.transferStatus ?? null,
//         transfersCount: trans?.transfersCount ?? 0,
//         // ✅ 缺货任务：返回 taskID 或 null
//         hasPendingOutofstockTask: pendingOosMap.get(p.productCode) ?? null
//       }
//     })
//     // 理论上他仓>0 已保留；这里再过滤一次更稳妥
//     .filter(p => (p.otherInventories?.length ?? 0) > 0)

//   return { products }
// }

///////////////////

// === NEW: 专看“低库存 + 其他仓有货”（不分页，复用现有常量/工具） ===
export const getLowStockWithOtherWarehouses = async (
  warehouseID: string,
  maxQty: number,
  keyword?: string,
  boxType?: string
) => {
  // 1) 产品基础筛选（复用你们的工具）
  const where: WhereOptions<Product> = {
    ...(buildProductWhereClause(keyword) as WhereOptions<Product>),
    ...(boxType?.trim()
      ? { boxType: { [Op.iLike]: `%${boxType.trim()}%` } }
      : {})
  }

  // 当前仓数量聚合
  const wh = sequelize.escape(warehouseID)
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

  // 他仓数量（同款）合计（>0）
  const otherQtySql = `
    COALESCE((
      SELECT SUM(i."quantity")
      FROM "inventory" i
      JOIN "bin" b ON b."binID" = i."binID"
      WHERE i."productCode" = "Product"."productCode"
        AND i."quantity" > 0
        AND b."type" = 'INVENTORY'
        AND b."warehouseID" <> ${wh}
    ), 0)
  `
  const otherQty = literal(otherQtySql)

  const having: any = {
    [Op.and]: [
      Sequelize.where(otherQty, { [Op.gt]: 0 }),
      Number(maxQty) === 0
        ? Sequelize.where(literal(qtyAggSql), { [Op.eq]: 0 })
        : Sequelize.where(literal(qtyAggSql), { [Op.lte]: Number(maxQty) })
    ]
  }

  // 2) 一次性查出满足条件的产品
  const rows = await Product.findAll({
    attributes: [...PRODUCT_ATTRS, [qtyAgg, 'totalQuantity']],
    where,
    include: INVENTORY_INCLUDE(warehouseID), // 仅挂当前仓的库存用于聚合
    group: PRODUCT_GROUP as unknown as string[],
    having,
    // 不按时间强排序：如果你们的 buildProductOrderClause 会按时间排序，可去掉或改为产品码排序
    // order: [['productCode', 'ASC']],
    subQuery: false
  })

  const pageProducts = rows.map(
    r => r.get({ plain: true }) as ProductLowRowPlain
  )
  const productCodes = pageProducts.map(p => p.productCode)
  if (productCodes.length === 0) return { products: [] }

  // 3) 拉取这些产品在“其他仓”的库存（>0），并把该 bin 的整格库存带出来
  const otherInvRows = await Inventory.findAll({
    attributes: ['inventoryID', 'productCode', 'quantity'],
    where: {
      productCode: { [Op.in]: productCodes },
      quantity: { [Op.gt]: 0 }
    },
    include: [
      {
        model: Bin,
        as: 'bin',
        attributes: ['binID', 'binCode', 'warehouseID', 'type'],
        required: true,
        where: {
          warehouseID: { [Op.ne]: warehouseID },
          type: BinType.INVENTORY
        },
        include: [
          {
            model: Warehouse,
            as: 'warehouse',
            attributes: ['warehouseID', 'warehouseCode'],
            required: false
          },
          {
            model: Inventory,
            as: 'inventories', // ⚠️ 与 Bin->Inventory 的别名保持一致
            required: false,
            attributes: ['inventoryID', 'productCode', 'quantity', 'binID'],
            where: { quantity: { [Op.gt]: 0 } }
          }
        ]
      }
    ],
    raw: false
  })

  type OtherInv = {
    inventoryID: string
    productCode?: string
    quantity: number
    bin?: {
      binID?: string
      binCode?: string
      warehouseID?: string
      warehouse?: { warehouseID?: string; warehouseCode?: string }
      inventories?: Array<{
        inventoryID: string
        productCode: string
        quantity: number
        binID?: string
      }>
    }
  }

  const otherByProduct = new Map<string, OtherInv[]>()

  for (const inv of otherInvRows as any[]) {
    const pcode = inv.get('productCode') as string
    const bin = inv.get('bin') as any

    const binInventories = (bin?.inventories || []).map((x: any) => ({
      inventoryID: x.get?.('inventoryID') ?? x.inventoryID,
      productCode: x.get?.('productCode') ?? x.productCode,
      quantity: Number(x.get?.('quantity') ?? x.quantity ?? 0),
      binID: x.get?.('binID') ?? x.binID
    }))

    const one: OtherInv = {
      inventoryID: inv.get('inventoryID'),
      productCode: pcode,
      quantity: Number(inv.get('quantity') ?? 0),
      bin: {
        binID: bin?.get?.('binID') ?? bin?.binID,
        binCode: bin?.get?.('binCode') ?? bin?.binCode,
        warehouseID: bin?.get?.('warehouseID') ?? bin?.warehouseID,
        warehouse: bin?.warehouse
          ? {
              warehouseID:
                bin.warehouse.get?.('warehouseID') ?? bin.warehouse.warehouseID,
              warehouseCode:
                bin.warehouse.get?.('warehouseCode') ??
                bin.warehouse.warehouseCode
            }
          : undefined,
        inventories: binInventories
      }
    }

    if (!otherByProduct.has(pcode)) otherByProduct.set(pcode, [])
    otherByProduct.get(pcode)!.push(one)
  }

  // 4) 汇总 Transfer（按 productCode）
  //    只看 destinationWarehouseID = 当前仓 的记录
  const transferRows = await Transfer.findAll({
    attributes: ['productCode', 'status'],
    where: {
      destinationWarehouseID: warehouseID,
      productCode: { [Op.in]: productCodes },
      status: { [Op.in]: ['PENDING', 'IN_PROCESS', 'COMPLETED'] }
    },
    raw: true
  })

  type TransStat = {
    transfersCount: number
    hasPendingTransfer: boolean
    transferStatus?: 'PENDING' | 'IN_PROCESS' | 'COMPLETED'
  }

  const statusRank: Record<string, number> = {
    IN_PROCESS: 3,
    PENDING: 2,
    COMPLETED: 1
  }

  const transByProduct = new Map<string, TransStat>()
  for (const r of transferRows as Array<{
    productCode: string
    status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED'
  }>) {
    const key = r.productCode
    const cur = transByProduct.get(key) || {
      transfersCount: 0,
      hasPendingTransfer: false,
      transferStatus: undefined as TransStat['transferStatus']
    }
    cur.transfersCount += 1
    if (r.status === 'PENDING') cur.hasPendingTransfer = true

    if (!cur.transferStatus) {
      cur.transferStatus = r.status
    } else {
      const curRank = statusRank[cur.transferStatus] ?? 0
      const nxtRank = statusRank[r.status] ?? 0
      if (nxtRank > curRank) cur.transferStatus = r.status
    }
    transByProduct.set(key, cur)
  }

  // 5) 汇总缺货任务（Out-of-Stock Task），返回 taskID（无则 null）
  const hasAttr = (model: any, attr: string) => !!model?.rawAttributes?.[attr]

  // 基础 where：只看 PENDING
  const oosWhere: any = {
    productCode: { [Op.in]: productCodes },
    status: 'PENDING'
    // 如有类型字段：type: 'OUT_OF_STOCK'
  }
  const oosInclude: any[] = []

  // 自适应“按仓过滤”的字段
  if (hasAttr(Task, 'warehouseID')) {
    oosWhere.warehouseID = warehouseID
  } else if (hasAttr(Task, 'destinationWarehouseID')) {
    oosWhere.destinationWarehouseID = warehouseID
  } else if (hasAttr(Task, 'destinationBinID')) {
    // 通过 join 目的 bin 的 warehouseID 过滤
    oosInclude.push({
      model: Bin,
      as: 'destinationBin', // ⚠️ 若别名不同请修改
      attributes: [],
      required: true,
      where: { warehouseID }
    })
  } // 否则无法按仓过滤，就不加（避免报错）

  const oosTaskRows = await Task.findAll({
    attributes: ['productCode', 'taskID'],
    where: oosWhere,
    include: oosInclude,
    raw: true
  })

  // productCode -> 某个 pending 缺货任务的 taskID（取第一条即可）
  const pendingOosMap = new Map<string, string | null>()
  for (const r of oosTaskRows as Array<{
    productCode: string
    taskID: string
  }>) {
    if (r.productCode && !pendingOosMap.has(r.productCode)) {
      pendingOosMap.set(r.productCode, r.taskID)
    }
  }

  // 6) 组装返回
  const products = pageProducts
    .map(p => {
      const trans = transByProduct.get(p.productCode)
      return {
        productCode: p.productCode,
        totalQuantity: Number(p.totalQuantity ?? 0),
        barCode: p.barCode,
        boxType: p.boxType,
        createdAt: p.createdAt,
        otherInventories: otherByProduct.get(p.productCode) ?? [],
        // 转运任务聚合
        hasPendingTransfer: !!trans?.hasPendingTransfer,
        transferStatus: trans?.transferStatus ?? null,
        transfersCount: trans?.transfersCount ?? 0,
        // ✅ 缺货任务：返回 taskID 或 null（前端据此展示“绿色标注”）
        hasPendingOutofstockTask: pendingOosMap.get(p.productCode) ?? null
      }
    })
    // 理论上他仓>0 已保留；这里再过滤一次更稳妥
    .filter(p => (p.otherInventories?.length ?? 0) > 0)

  // 7) 排序：有“缺货任务”的优先，其次按当前仓数量少的优先，再按产品码稳定
  products.sort((a, b) => {
    const aHas = !!a.hasPendingOutofstockTask
    const bHas = !!b.hasPendingOutofstockTask
    if (aHas !== bHas) return aHas ? -1 : 1
    if ((a.totalQuantity ?? 0) !== (b.totalQuantity ?? 0)) {
      return (a.totalQuantity ?? 0) - (b.totalQuantity ?? 0)
    }
    return String(a.productCode).localeCompare(String(b.productCode))
  })

  return { products }
}
