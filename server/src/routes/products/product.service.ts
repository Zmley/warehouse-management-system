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
    attributes: ['productCode', 'barCode', 'boxType', 'createdAt', 'updatedAt'],
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
    updatedAt: Date
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
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
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
  'createdAt',
  'updatedAt'
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
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
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

type CurAggRow = {
  productCode: string
  totalQuantity: number | string
}

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
    inventories?: Array<{
      inventoryID: string
      productCode: string
      quantity: number
      binID: string
    }>
  }
}

type ProductLowDTO = {
  productCode: string
  barCode?: string | null
  boxType?: string | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null

  totalQuantity: number
  otherInventories: Array<{
    productCode: string
    quantity: number
    binTotal: number
    bin: OtherInvRow['bin']
  }>
  hasPendingTransfer: boolean
  transferStatus: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | null
  transfersCount: number
  hasPendingOutofstockTask: string | null
}

export const getLowStockWithOtherWarehouses = async (
  warehouseID: string,
  maxQty: number,
  keyword?: string,
  boxType?: string
): Promise<{ products: ProductLowDTO[]; total: number }> => {
  const curAgg = await Inventory.findAll({
    attributes: ['productCode', [fn('SUM', col('quantity')), 'totalQuantity']],
    include: [
      {
        model: Bin,
        as: 'bin',
        attributes: [],
        required: true,
        where: { warehouseID, type: BinType.INVENTORY }
      }
    ],
    where: { quantity: { [Op.gt]: 0 } },
    group: ['productCode'],
    raw: true
  })

  const curTotalMap = new Map<string, number>()
  for (const r of curAgg as unknown as CurAggRow[]) {
    curTotalMap.set(r.productCode, Number(r.totalQuantity ?? 0))
  }

  const productBaseWhere: WhereOptions<Product> = {
    ...(buildProductWhereClause(keyword) as WhereOptions<Product>),
    ...(boxType?.trim()
      ? { boxType: { [Op.iLike]: `%${boxType.trim()}%` } }
      : {})
  }

  const baseProducts = await Product.findAll({
    attributes: ['productCode', 'barCode', 'boxType', 'createdAt', 'updatedAt'],
    where: productBaseWhere,
    raw: true
  })

  const lowStockProducts = baseProducts.filter(p => {
    const qty = curTotalMap.get(p.productCode) ?? 0
    return Number(maxQty) === 0 ? qty === 0 : qty <= Number(maxQty)
  })

  const productCodes = lowStockProducts.map(p => p.productCode)
  if (productCodes.length === 0) return { products: [], total: 0 }

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
            as: 'inventories',
            required: false,
            attributes: ['inventoryID', 'productCode', 'quantity', 'binID'],
            where: { quantity: { [Op.gt]: 0 } }
          }
        ]
      }
    ],
    raw: false
  })

  type BinKey = string
  const binSumMap = new Map<
    BinKey,
    { productCode: string; bin: OtherInvRow['bin']; sum: number }
  >()

  for (const inv of otherInvRows as unknown as OtherInvRow[]) {
    const pcode = inv.productCode
    const bin = inv.bin
    if (!pcode || !bin?.binID) continue
    const key = `${pcode}|${bin.binID}`
    const prev = binSumMap.get(key)
    const q = Number(inv.quantity || 0)
    if (!prev) binSumMap.set(key, { productCode: pcode, bin, sum: q })
    else prev.sum += q
  }

  const otherByProduct = new Map<
    string,
    Array<{
      productCode: string
      quantity: number
      binTotal: number
      bin: OtherInvRow['bin']
    }>
  >()

  for (const { productCode, bin, sum } of binSumMap.values()) {
    if (!otherByProduct.has(productCode)) otherByProduct.set(productCode, [])
    otherByProduct.get(productCode)!.push({
      productCode,
      quantity: sum,
      binTotal: sum,
      bin
    })
  }

  const filtered = lowStockProducts.filter(
    p => (otherByProduct.get(p.productCode)?.length ?? 0) > 0
  )
  const filteredCodes = filtered.map(p => p.productCode)
  if (filteredCodes.length === 0) return { products: [], total: 0 }

  const transferRows = await Transfer.findAll({
    attributes: ['productCode', 'status'],
    where: {
      destinationWarehouseID: warehouseID,
      productCode: { [Op.in]: filteredCodes },
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

  for (const r of transferRows as Array<{
    productCode: string
    status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED'
  }>) {
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

  const oosTaskRows = await Task.findAll({
    attributes: ['productCode', 'taskID'],
    where: {
      productCode: { [Op.in]: filteredCodes },
      status: 'PENDING'
    },
    raw: true
  })

  const pendingOosMap = new Map<string, string>()
  for (const t of oosTaskRows as Array<{
    productCode: string
    taskID: string
  }>) {
    if (!pendingOosMap.has(t.productCode))
      pendingOosMap.set(t.productCode, t.taskID)
  }

  const products: ProductLowDTO[] = filtered.map(p => {
    const qty = curTotalMap.get(p.productCode) ?? 0
    const trans = transByProduct.get(p.productCode)
    return {
      productCode: p.productCode,
      barCode: p.barCode || null,
      boxType: p.boxType || null,

      createdAt: p.createdAt || null,

      updateAt: p.updatedAt || null,
      totalQuantity: qty,
      otherInventories: otherByProduct.get(p.productCode) ?? [],
      hasPendingTransfer: !!trans?.hasPendingTransfer,
      transferStatus:
        (trans?.transferStatus as ProductLowDTO['transferStatus']) ?? null,
      transfersCount: trans?.transfersCount ?? 0,
      hasPendingOutofstockTask: pendingOosMap.get(p.productCode) ?? null
    }
  })

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
