import { getBinsByBinCodes } from 'routes/bins/bin.service'
import { Inventory } from './inventory.model'
import { Bin } from 'routes/bins/bin.model'
import {
  Op,
  WhereOptions,
  Order,
  col,
  literal,
  ProjectionAlias,
  fn
} from 'sequelize'
import { InventoryUploadType } from 'types/inventory'
import AppError from 'utils/appError'
import { buildBinCodeToIDMap } from 'utils/bin.utils'
import { LiteralType } from 'typescript'
import { sequelize } from 'config/db'

export const getInventoriesByCartID = async (
  cartID: string
): Promise<{
  hasProduct: boolean
  inventories: (Inventory & { pickupBinCode: string[] })[]
}> => {
  const inventories = await Inventory.findAll({ where: { binID: cartID } })
  if (!inventories.length) return { hasProduct: false, inventories: [] }

  const productCodes = inventories.map(i => i.productCode)

  const bins = await Bin.findAll({
    where: {
      [Op.or]: productCodes.map(c => ({
        defaultProductCodes: { [Op.like]: `%${c}%` }
      }))
    },
    attributes: ['binCode', 'defaultProductCodes']
  })

  const productToBins = bins.reduce<Record<string, string[]>>((acc, bin) => {
    const codes = (bin.defaultProductCodes || '').split(',').map(c => c.trim())
    codes.forEach(code => {
      if (productCodes.includes(code)) {
        acc[code] = [...(acc[code] || []), bin.binCode]
      }
    })
    return acc
  }, {})

  const inventoriesWithBins = inventories.map(inv =>
    Object.assign(inv.get({ plain: true }), {
      pickupBinCode: productToBins[inv.productCode] || []
    })
  )

  return { hasProduct: true, inventories: inventoriesWithBins }
}

type SortField = 'binCode' | 'updatedAt'
type SortOrder = 'ASC' | 'DESC'

function normalizeCount(count: unknown): number {
  if (typeof count === 'number') return count
  if (Array.isArray(count)) return count.length
  if (count && typeof count === 'object') {
    const arr = count as Array<{ count?: number }>
    if (Array.isArray(arr) && typeof arr[0]?.count === 'number') {
      return arr[0].count!
    }
  }
  return 0
}

export interface InventoryDTO {
  inventoryID: string | null
  binID: string
  productCode: string | null
  quantity: number | null
  createdAt: Date | null
  updatedAt: Date | null
  bin: {
    binCode: string
    binID: string
  }
}

// export const getInventoriesByWarehouseID = async (
//   warehouseID: string,
//   binID?: string,
//   page = 1,
//   limit = 20,
//   keyword?: string,
//   opts: { sortBy?: SortField; sortOrder?: SortOrder } = {}
// ): Promise<{ inventories: InventoryDTO[]; totalCount: number }> => {
//   try {
//     const { sortBy = 'updatedAt', sortOrder = 'DESC' } = opts

//     const binWhere: WhereOptions = {
//       warehouseID,
//       type: 'INVENTORY'
//     }
//     if (binID) Object.assign(binWhere, { binID })

//     let filteredByBinCode = false
//     let extraBinIDsByProduct: string[] = []

//     if (keyword && keyword.trim() !== '') {
//       const k = keyword.trim()
//       Object.assign(binWhere, { binCode: { [Op.iLike]: `${k}%` } })
//       filteredByBinCode = true

//       const invRows = await Inventory.findAll({
//         attributes: ['binID'],
//         where: { productCode: { [Op.iLike]: `${k}%` } },
//         group: ['binID'],
//         raw: true
//       })
//       extraBinIDsByProduct = invRows.map(row =>
//         String((row as unknown as { binID: string }).binID)
//       )
//     }

//     const latestInvSubq =
//       `(SELECT MAX(inv."updatedAt") FROM "inventory" AS inv ` +
//       `WHERE inv."binID" = "Bin"."binID")`

//     const binOrder: Order =
//       sortBy === 'binCode'
//         ? [[col('binCode'), sortOrder]]
//         : [
//             [literal(`(${latestInvSubq}) IS NULL`), 'ASC'],
//             [literal(latestInvSubq), sortOrder],
//             [col('binCode'), 'ASC']
//           ]

//     let queryResult = await Bin.findAndCountAll({
//       where: binWhere,
//       attributes: [
//         'binID',
//         'binCode',
//         [literal(latestInvSubq), 'latestInvUpdatedAt']
//       ],
//       include: [
//         {
//           model: Inventory,
//           as: 'inventories',
//           required: false,
//           separate: true,
//           attributes: [
//             'inventoryID',
//             'binID',
//             'productCode',
//             'quantity',
//             'createdAt',
//             'updatedAt'
//           ],
//           order:
//             sortBy === 'updatedAt'
//               ? [['updatedAt', sortOrder]]
//               : [['updatedAt', 'DESC']]
//         }
//       ],
//       order: binOrder,
//       offset: (page - 1) * limit,
//       limit,
//       subQuery: false,
//       distinct: true,
//       raw: false
//     })

//     if (
//       keyword &&
//       filteredByBinCode &&
//       queryResult.rows.length === 0 &&
//       extraBinIDsByProduct.length > 0
//     ) {
//       const whereByProduct: WhereOptions = {
//         warehouseID,
//         type: 'INVENTORY',
//         binID: { [Op.in]: extraBinIDsByProduct }
//       }

//       queryResult = await Bin.findAndCountAll({
//         where: whereByProduct,
//         attributes: [
//           'binID',
//           'binCode',
//           [literal(latestInvSubq), 'latestInvUpdatedAt']
//         ],
//         include: [
//           {
//             model: Inventory,
//             as: 'inventories',
//             required: true,
//             separate: true,
//             where: { productCode: { [Op.iLike]: `${keyword!.trim()}%` } },
//             attributes: [
//               'inventoryID',
//               'binID',
//               'productCode',
//               'quantity',
//               'createdAt',
//               'updatedAt'
//             ],
//             order:
//               sortBy === 'updatedAt'
//                 ? [['updatedAt', sortOrder]]
//                 : [['updatedAt', 'DESC']]
//           }
//         ],
//         order: binOrder,
//         offset: (page - 1) * limit,
//         limit,
//         subQuery: false,
//         distinct: true,
//         raw: false
//       })
//     }

//     const totalCount = normalizeCount(queryResult.count)

//     const inventories: InventoryDTO[] = queryResult.rows.flatMap(binRow => {
//       const binIDVal = binRow.getDataValue('binID')
//       const binCodeVal = binRow.getDataValue('binCode')
//       const invs =
//         (binRow as unknown as { inventories?: Inventory[] }).inventories ?? []

//       if (!invs || invs.length === 0) {
//         return [
//           {
//             inventoryID: null,
//             binID: binIDVal,
//             productCode: null,
//             quantity: null,
//             createdAt: null,
//             updatedAt: null,
//             bin: { binCode: binCodeVal, binID: binIDVal }
//           }
//         ]
//       }

//       return invs.map(inv => ({
//         inventoryID: inv.getDataValue('inventoryID'),
//         binID: inv.getDataValue('binID'),
//         productCode: inv.getDataValue('productCode'),
//         quantity: inv.getDataValue('quantity'),
//         createdAt: inv.getDataValue('createdAt'),
//         updatedAt: inv.getDataValue('updatedAt'),
//         bin: {
//           binCode: binCodeVal,
//           binID: binIDVal
//         }
//       }))
//     })

//     return { inventories, totalCount }
//   } catch (err) {
//     console.error('getInventoriesByWarehouseID failed:', err)
//     if (err instanceof AppError) throw err
//     throw new AppError(500, 'Failed to fetch inventories')
//   }
// }

// const normalizeCount = (val: number | { count: number }[]): number => {
//   if (typeof val === 'number') return val
//   if (Array.isArray(val) && val.length > 0 && typeof (val[0] as any).count === 'number') {
//     return Number((val[0] as any).count)
//   }
//   return 0
// }

export const getInventoriesByWarehouseID = async (
  warehouseID: string,
  binID?: string,
  page = 1,
  limit = 20,
  keyword?: string,
  opts: { sortBy?: SortField; sortOrder?: SortOrder } = {}
): Promise<{ inventories: InventoryDTO[]; totalCount: number }> => {
  try {
    const { sortBy = 'updatedAt', sortOrder = 'DESC' } = opts
    const offset = (page - 1) * limit
    const sortOrderSql = sortOrder === 'ASC' ? 'ASC' : 'DESC'

    if (sortBy === 'updatedAt') {
      const includeBinWhere: WhereOptions = { warehouseID, type: 'INVENTORY' }

      const invWhereAnd: any[] = []
      if (binID) invWhereAnd.push({ binID })

      const hasKeyword = !!keyword && keyword.trim() !== ''
      const k = hasKeyword ? keyword!.trim() : ''

      if (hasKeyword) {
        invWhereAnd.push({
          [Op.or]: [
            { productCode: { [Op.iLike]: `${k}%` } },
            sequelize.where(col('bin.binCode'), { [Op.iLike]: `${k}%` })
          ]
        })
      }

      const invWhere: WhereOptions = invWhereAnd.length
        ? { [Op.and]: invWhereAnd }
        : {}

      const invTotal = await Inventory.count({
        where: invWhere,
        include: [
          {
            model: Bin,
            as: 'bin',
            required: true,
            where: includeBinWhere,
            attributes: []
          }
        ],
        distinct: true,
        col: 'inventoryID'
      })

      const invRows = await Inventory.findAll({
        attributes: [
          'inventoryID',
          'binID',
          'productCode',
          'quantity',
          'createdAt',
          'updatedAt'
        ],
        where: invWhere,
        include: [
          {
            model: Bin,
            as: 'bin',
            required: true,
            where: includeBinWhere,
            attributes: ['binID', 'binCode']
          }
        ],
        order: [
          [col('updatedAt'), sortOrderSql],
          [col('inventoryID'), 'ASC']
        ] as Order,
        offset,
        limit,
        raw: false
      })

      const inventories: InventoryDTO[] = invRows.map(inv => {
        const b = (inv as any).bin as Bin | null
        return {
          inventoryID: inv.getDataValue('inventoryID'),
          binID: inv.getDataValue('binID'),
          productCode: inv.getDataValue('productCode'),
          quantity: inv.getDataValue('quantity'),
          createdAt: inv.getDataValue('createdAt'),
          updatedAt: inv.getDataValue('updatedAt'),
          bin: {
            binCode: b?.getDataValue('binCode') ?? null,
            binID: b?.getDataValue('binID') ?? inv.getDataValue('binID')
          }
        }
      })

      let emptyBinTotal = 0
      let placeholders: InventoryDTO[] = []

      if (hasKeyword || binID || inventories.length < limit) {
        const binOnlyWhere: WhereOptions = { warehouseID, type: 'INVENTORY' }
        if (binID) Object.assign(binOnlyWhere, { binID })
        if (hasKeyword)
          Object.assign(binOnlyWhere, { binCode: { [Op.iLike]: `${k}%` } })

        emptyBinTotal = await Bin.count({
          where: {
            ...binOnlyWhere,
            [Op.and]: [
              sequelize.where(col('inventories.inventoryID'), { [Op.is]: null })
            ]
          },
          include: [
            {
              model: Inventory,
              as: 'inventories',
              required: false,
              attributes: []
            }
          ],
          distinct: true,
          col: 'binID'
        })

        const room = Math.max(0, limit - inventories.length)
        if (room > 0 && emptyBinTotal > 0) {
          const emptyBins = await Bin.findAll({
            where: {
              ...binOnlyWhere,
              [Op.and]: [
                sequelize.where(col('inventories.inventoryID'), {
                  [Op.is]: null
                })
              ]
            },
            attributes: ['binID', 'binCode'],
            include: [
              {
                model: Inventory,
                as: 'inventories',
                required: false,
                attributes: []
              }
            ],
            order: [
              [col('binCode'), 'ASC'],
              [col('binID'), 'ASC']
            ] as Order,
            limit: room,
            subQuery: false
          })

          placeholders = emptyBins.map(b => ({
            inventoryID: null,
            binID: b.getDataValue('binID'),
            productCode: null,
            quantity: null,
            createdAt: null,
            updatedAt: null,
            bin: {
              binCode: b.getDataValue('binCode'),
              binID: b.getDataValue('binID')
            }
          }))
        }
      }

      const totalCount = invTotal + emptyBinTotal
      return { inventories: [...inventories, ...placeholders], totalCount }
    }

    const binWhere: WhereOptions = { warehouseID, type: 'INVENTORY' }
    if (binID) Object.assign(binWhere, { binID })

    let filteredByBinCode = false
    let extraBinIDsByProduct: string[] = []

    if (keyword && keyword.trim() !== '') {
      const k = keyword.trim()
      Object.assign(binWhere, { binCode: { [Op.iLike]: `${k}%` } })
      filteredByBinCode = true

      const invRows = await Inventory.findAll({
        attributes: ['binID'],
        where: { productCode: { [Op.iLike]: `${k}%` } },
        group: ['binID'],
        raw: true
      })
      extraBinIDsByProduct = invRows.map(row =>
        String((row as unknown as { binID: string }).binID)
      )
    }

    const binOrder: Order = [
      [col('binCode'), sortOrderSql],
      [col('binID'), 'ASC']
    ]

    let queryResult = await Bin.findAndCountAll({
      where: binWhere,
      attributes: ['binID', 'binCode'],
      include: [
        {
          model: Inventory,
          as: 'inventories',
          required: false,
          separate: true,
          attributes: [
            'inventoryID',
            'binID',
            'productCode',
            'quantity',
            'createdAt',
            'updatedAt'
          ],
          order: [['updatedAt', 'DESC']]
        }
      ],
      order: binOrder,
      offset,
      limit,
      subQuery: false,
      distinct: true,
      raw: false
    })

    if (
      keyword &&
      filteredByBinCode &&
      queryResult.rows.length === 0 &&
      extraBinIDsByProduct.length > 0
    ) {
      const whereByProduct: WhereOptions = {
        warehouseID,
        type: 'INVENTORY',
        binID: { [Op.in]: extraBinIDsByProduct }
      }

      queryResult = await Bin.findAndCountAll({
        where: whereByProduct,
        attributes: ['binID', 'binCode'],
        include: [
          {
            model: Inventory,
            as: 'inventories',
            required: true,
            where: { productCode: { [Op.iLike]: `${keyword!.trim()}%` } },
            separate: true,
            attributes: [
              'inventoryID',
              'binID',
              'productCode',
              'quantity',
              'createdAt',
              'updatedAt'
            ],
            order: [['updatedAt', 'DESC']]
          }
        ],
        order: binOrder,
        offset,
        limit,
        subQuery: false,
        distinct: true,
        raw: false
      })
    }

    const totalCount = normalizeCount(queryResult.count)

    const inventories: InventoryDTO[] = queryResult.rows.flatMap(binRow => {
      const binIDVal = binRow.getDataValue('binID')
      const binCodeVal = binRow.getDataValue('binCode')
      const invs =
        (binRow as unknown as { inventories?: Inventory[] }).inventories ?? []

      if (!invs || invs.length === 0) {
        return [
          {
            inventoryID: null,
            binID: binIDVal,
            productCode: null,
            quantity: null,
            createdAt: null,
            updatedAt: null,
            bin: { binCode: binCodeVal, binID: binIDVal }
          }
        ]
      }

      return invs.map(inv => ({
        inventoryID: inv.getDataValue('inventoryID'),
        binID: inv.getDataValue('binID'),
        productCode: inv.getDataValue('productCode'),
        quantity: inv.getDataValue('quantity'),
        createdAt: inv.getDataValue('createdAt'),
        updatedAt: inv.getDataValue('updatedAt'),
        bin: { binCode: binCodeVal, binID: binIDVal }
      }))
    })

    return { inventories, totalCount }
  } catch (err) {
    console.error('getInventoriesByWarehouseID failed:', err)
    if (err instanceof AppError) throw err
    throw new AppError(500, 'Failed to fetch inventories')
  }
}

export const deleteByInventoryID = async (
  inventoryID: string
): Promise<{ message: string }> => {
  try {
    const inventoryItem = await Inventory.findByPk(inventoryID)

    if (!inventoryItem) {
      return { message: 'Inventory item not found' }
    }

    await inventoryItem.destroy()
    return { message: 'Inventory item deleted successfully' }
  } catch (error) {
    console.error(error)
    if (error instanceof AppError) throw error

    throw new Error('Error deleting inventory item')
  }
}

export const updateByInventoryIDs = async (
  updates: {
    inventoryID: string
    quantity?: number
    productCode?: string
  }[]
) => {
  try {
    const results = await Promise.all(
      updates.map(async update => {
        const { inventoryID, quantity, productCode } = update
        const inventoryItem = await Inventory.findByPk(inventoryID)

        if (!inventoryItem) {
          return {
            inventoryID,
            success: false,
            message: 'Inventory item not found'
          }
        }

        await inventoryItem.update({ quantity, productCode })
        return { inventoryID, success: true, updatedItem: inventoryItem }
      })
    )

    return results
  } catch (error) {
    throw new Error(`Failed to bulk update inventories: ${error.message}`)
  }
}

export const addInventories = async (inventoryList: InventoryUploadType[]) => {
  let insertedCount = 0

  if (inventoryList.length === 0) {
    return { success: true, insertedCount: 0, updatedCount: 0 }
  }

  const bins = await getBinsByBinCodes(inventoryList)
  const binCodeToBinID = buildBinCodeToIDMap(bins)

  const BATCH_SIZE = 5

  for (let i = 0; i < inventoryList.length; i += BATCH_SIZE) {
    const batch = inventoryList.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async item => {
        const cleanBinCode = item.binCode.trim()
        const cleanProductCode = item.productCode.trim().toUpperCase()
        const binID = binCodeToBinID.get(cleanBinCode)

        if (!binID) return

        await Inventory.create({
          binID,
          productCode: cleanProductCode,
          quantity: item.quantity
        })
        insertedCount++
      })
    )
  }

  return {
    success: true,
    insertedCount,
    updatedCount: 0
  }
}

export const checkInventoryQuantity = async (
  sourceBinID: string,
  productCode: string,
  requiredQuantity: number
): Promise<void> => {
  if (productCode === 'ALL') return

  const inventoryItem = await Inventory.findOne({
    where: {
      binID: sourceBinID,
      productCode
    }
  })

  if (!inventoryItem) {
    throw new AppError(
      404,
      `❌ No product ${productCode} found in the source bin`
    )
  }

  if (inventoryItem.quantity < requiredQuantity) {
    throw new AppError(
      400,
      `❌ Not enough inventory. Available: ${inventoryItem.quantity}, Required: ${requiredQuantity}`
    )
  }
}

export const getCartInventories = async (
  cartID: string
): Promise<Inventory[]> => {
  const items = await Inventory.findAll({
    where: { binID: cartID }
  })
  return items
}

export const getInventoriesByBinID = async (
  binID: string
): Promise<Inventory[]> => {
  const inventories = await Inventory.findAll({
    where: { binID },
    include: [
      {
        model: Bin,
        as: 'bin',
        attributes: ['binID', 'binCode']
      }
    ],
    order: [['productCode', 'ASC']]
  })

  return inventories
}
