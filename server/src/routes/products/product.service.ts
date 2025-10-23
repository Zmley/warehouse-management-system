import Product from 'routes/products/product.model'
import { col, fn, literal, Op, Sequelize, WhereOptions } from 'sequelize'
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
//     // 不按时间强排序：如果你们的 buildProductOrderClause 会按时间排序，可去掉或改为产品码排序
//     // order: [['productCode', 'ASC']],
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
//         // ✅ 缺货任务：返回 taskID 或 null（前端据此展示“绿色标注”）
//         hasPendingOutofstockTask: pendingOosMap.get(p.productCode) ?? null
//       }
//     })
//     // 理论上他仓>0 已保留；这里再过滤一次更稳妥
//     .filter(p => (p.otherInventories?.length ?? 0) > 0)

//   // 7) 排序：有“缺货任务”的优先，其次按当前仓数量少的优先，再按产品码稳定
//   products.sort((a, b) => {
//     const aHas = !!a.hasPendingOutofstockTask
//     const bHas = !!b.hasPendingOutofstockTask
//     if (aHas !== bHas) return aHas ? -1 : 1
//     if ((a.totalQuantity ?? 0) !== (b.totalQuantity ?? 0)) {
//       return (a.totalQuantity ?? 0) - (b.totalQuantity ?? 0)
//     }
//     return String(a.productCode).localeCompare(String(b.productCode))
//   })

//   return { products }
// }

/** —— 行类型（用于 raw/nest 聚合返回） —— */

type OtherInvRow = {
  inventoryID: string
  productCode: string
  quantity: number
  bin: {
    binID: string
    binCode: string
    warehouseID: string
    type: string
    warehouse?: { warehouseID: string; warehouseCode: string }
  }
}

export const getLowStockWithOtherWarehouses = async (
  warehouseID: string,
  maxQty: number,
  keyword?: string,
  boxType?: string
) => {
  /** 1) 先在 Inventory 表里，按 productCode 统计【当前仓】总数（只算 INVENTORY 类货位，可按需放宽） */
  const curAgg = await Inventory.findAll({
    attributes: ['productCode', [fn('SUM', col('quantity')), 'totalQuantity']],
    include: [
      {
        model: Bin,
        as: 'bin',
        attributes: [],
        required: true,
        where: {
          warehouseID,
          type: BinType.INVENTORY // 如需放宽：{ [Op.in]: [BinType.INVENTORY, BinType.PICK, ...] }
        }
      }
    ],
    where: { quantity: { [Op.gt]: 0 } },
    group: ['productCode'],
    raw: true
  })

  // productCode -> 当前仓总数
  const curTotalMap = new Map<string, number>()
  type CurAggRow = {
    productCode: string
    totalQuantity: number | string
  }
  for (const r of curAgg as unknown as CurAggRow[]) {
    curTotalMap.set(r.productCode, Number(r.totalQuantity ?? 0))
  }

  /** 2) 基于产品基础筛选，选出“在当前仓总数 ≤ maxQty”的产品集合（如果 maxQty=0 就等于 0） */
  const baseWhere: WhereOptions<any> = {
    ...(buildProductWhereClause(keyword) as any),
    ...(boxType?.trim()
      ? { boxType: { [Op.iLike]: `%${boxType.trim()}%` } }
      : {})
  }

  // 先取出满足基础筛选的产品（只取需要的字段，避免大表宽联）
  const baseProducts = await Product.findAll({
    attributes: ['productCode', 'barCode', 'boxType', 'createdAt'],
    where: baseWhere,
    raw: true
  })

  // 低库存过滤（用第1步的汇总结果）
  const lowStockProducts = baseProducts.filter(p => {
    const qty = curTotalMap.get(p.productCode) ?? 0
    return Number(maxQty) === 0 ? qty === 0 : qty <= Number(maxQty)
  })

  const productCodes = lowStockProducts.map(p => p.productCode)
  if (productCodes.length === 0) return { products: [], total: 0 }

  /** 3) 找“其他仓”的库存（>0） */
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
          type: BinType.INVENTORY // 如需放宽同上
        },
        include: [
          {
            model: Warehouse,
            as: 'warehouse',
            attributes: ['warehouseID', 'warehouseCode'],
            required: false
          }
        ]
      }
    ],
    raw: false
  })

  // 同一“其他仓 bin”内，该款的数量之和（一个 bin 里同款可能有多条 Inventory，保险起见再汇总一下）
  type BinKey = string
  const otherByProduct = new Map<
    string,
    Array<{
      productCode: string
      quantity: number
      binTotal: number
      bin: OtherInvRow['bin']
    }>
  >()

  // 先把每个 bin 里该款的数量聚合： productCode+binID -> sum
  const binSumMap = new Map<
    BinKey,
    { productCode: string; bin: any; sum: number }
  >()
  for (const inv of otherInvRows as any as OtherInvRow[]) {
    const p = inv.productCode
    const b = inv.bin
    if (!p || !b?.binID) continue
    const key = `${p}|${b.binID}`
    const prev = binSumMap.get(key)
    if (!prev)
      binSumMap.set(key, {
        productCode: p,
        bin: b,
        sum: Number(inv.quantity || 0)
      })
    else prev.sum += Number(inv.quantity || 0)
  }

  // 再灌回到 productCode -> list
  for (const { productCode, bin, sum } of binSumMap.values()) {
    if (!otherByProduct.has(productCode)) otherByProduct.set(productCode, [])
    otherByProduct.get(productCode)!.push({
      productCode,
      quantity: sum, // 该 bin 内此款合计
      binTotal: sum, // 也可以保留同含义字段
      bin
    })
  }

  /** 4) 有些产品虽然低库存，但“其他仓没有货”——剔除它们 */
  const filtered = lowStockProducts.filter(
    p => (otherByProduct.get(p.productCode)?.length ?? 0) > 0
  )

  /** 5) 拉取这些产品在转运/缺货任务上的“状态汇总”（只用轻量字段） */
  const transferRows = await Transfer.findAll({
    attributes: ['productCode', 'status'],
    where: {
      destinationWarehouseID: warehouseID,
      productCode: { [Op.in]: filtered.map(p => p.productCode) },
      status: { [Op.in]: ['PENDING', 'IN_PROCESS', 'COMPLETED'] }
    },
    raw: true
  })

  const statusRank: Record<string, number> = {
    IN_PROCESS: 3,
    PENDING: 2,
    COMPLETED: 1
  }
  const transByProduct = new Map<
    string,
    {
      transfersCount: number
      hasPendingTransfer: boolean
      transferStatus?: 'PENDING' | 'IN_PROCESS' | 'COMPLETED'
    }
  >()
  for (const r of transferRows as Array<{ productCode: string; status: any }>) {
    const cur = transByProduct.get(r.productCode) || {
      transfersCount: 0,
      hasPendingTransfer: false,
      transferStatus: undefined
    }
    cur.transfersCount += 1
    if (r.status === 'PENDING') cur.hasPendingTransfer = true
    if (
      !cur.transferStatus ||
      (statusRank[r.status] ?? 0) > (statusRank[cur.transferStatus] ?? 0)
    ) {
      cur.transferStatus = r.status
    }
    transByProduct.set(r.productCode, cur)
  }

  // 缺货 Task（只看 PENDING；按你们模型字段择一过滤）
  const oosTasks = await Task.findAll({
    attributes: ['productCode', 'taskID'],
    where: {
      productCode: { [Op.in]: filtered.map(p => p.productCode) },
      status: 'PENDING'
    },
    raw: true
  })
  const pendingOosMap = new Map<string, string>()
  for (const t of oosTasks as Array<{ productCode: string; taskID: string }>) {
    if (!pendingOosMap.has(t.productCode))
      pendingOosMap.set(t.productCode, t.taskID)
  }

  /** 6) 组装返回（并保证 totalQuantity 取自【第1步聚合】） */
  const products = filtered.map(p => {
    const qty = curTotalMap.get(p.productCode) ?? 0
    const trans = transByProduct.get(p.productCode)
    return {
      productCode: p.productCode,
      barCode: p.barCode,
      boxType: p.boxType,
      createdAt: p.createdAt,
      totalQuantity: qty, // ✅ 来自 Inventory 聚合的“当前仓总数”，不会被重复行影响
      otherInventories: otherByProduct.get(p.productCode) ?? [],
      hasPendingTransfer: !!trans?.hasPendingTransfer,
      transferStatus: trans?.transferStatus ?? null,
      transfersCount: trans?.transfersCount ?? 0,
      hasPendingOutofstockTask: pendingOosMap.get(p.productCode) ?? null
    }
  })

  // 排序：有缺货任务优先 → 当前仓更少 → 产品码
  products.sort((a, b) => {
    const aHas = !!a.hasPendingOutofstockTask
    const bHas = !!b.hasPendingOutofstockTask
    if (aHas !== bHas) return aHas ? -1 : 1
    if (a.totalQuantity !== b.totalQuantity)
      return a.totalQuantity - b.totalQuantity
    return String(a.productCode).localeCompare(String(b.productCode))
  })

  return { products, total: products.length }
}
