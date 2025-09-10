import { getBinsByBinCodes } from 'routes/bins/bin.service'
import { Inventory } from './inventory.model'
import { Bin } from 'routes/bins/bin.model'
import {
  Op,
  WhereOptions,
  Order,
  col,
  fn,
  literal,
  FindAttributeOptions
} from 'sequelize'
import { InventoryUploadType } from 'types/inventory'
import AppError from 'utils/appError'
import { buildBinCodeToIDMap } from 'utils/bin.utils'

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

// export const getInventoriesByWarehouseID = async (
//   warehouseID: string,
//   binID?: string,
//   page = 1,
//   limit = 20,
//   keyword?: string,
//   opts: { sortBy?: 'binCode' | 'updatedAt'; sortOrder?: 'ASC' | 'DESC' } = {}
// ) => {
//   const { sortBy = 'updatedAt', sortOrder = 'DESC' } = opts

//   const binWhere: WhereOptions = {
//     warehouseID,
//     type: { [Op.in]: ['INVENTORY'] }
//   }
//   if (binID) Object.assign(binWhere, { binID })

//   const where: WhereOptions = {}
//   if (keyword) {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     ;(where as any)[Op.or] = [
//       { productCode: keyword },
//       { ['$bin.binCode$']: keyword }
//     ]
//   }

//   const order: Order =
//     sortBy === 'binCode'
//       ? [
//           [col('bin.binCode'), sortOrder],
//           ['updatedAt', 'DESC']
//         ]
//       : [
//           ['updatedAt', sortOrder],
//           [col('bin.binCode'), 'ASC']
//         ]

//   const result = await Inventory.findAndCountAll({
//     where,
//     include: [
//       {
//         model: Bin,
//         as: 'bin',
//         attributes: ['binCode', 'binID'],
//         where: binWhere
//       }
//     ],
//     distinct: true,
//     subQuery: false,
//     offset: (page - 1) * limit,
//     limit,
//     order
//   })

//   return result
// }

export const getInventoriesByWarehouseID = async (
  warehouseID: string,
  binID?: string,
  page = 1,
  limit = 20,
  keyword?: string,
  opts: { sortBy?: 'binCode' | 'updatedAt'; sortOrder?: 'ASC' | 'DESC' } = {}
) => {
  try {
    const { sortBy = 'updatedAt', sortOrder = 'DESC' } = opts

    const binWhere: WhereOptions = {
      warehouseID,
      type: 'INVENTORY'
    }
    if (binID) Object.assign(binWhere, { binID })

    let filteredByBinCode = false
    let extraBinIDsByProduct: string[] = []

    if (keyword && keyword.trim() !== '') {
      const k = keyword.trim()
      Object.assign(binWhere, { binCode: k })
      filteredByBinCode = true

      const invRows = await Inventory.findAll({
        attributes: ['binID'],
        where: { productCode: k },
        group: ['binID'],
        raw: true
      })
      extraBinIDsByProduct = invRows.map(r => (r as any).binID as string)
    }

    // 每个 bin 的最新库存时间（用于对 Bin 排序）
    const latestInvSubq = `(SELECT MAX(inv."updatedAt") FROM "inventory" AS inv WHERE inv."binID" = "Bin"."binID")`

    // Bin 排序规则：
    // - binCode：直接按 binCode
    // - updatedAt：先把 NULL 放最后，再按时间，再按 binCode 稳定次序
    const binOrder: Order =
      sortBy === 'binCode'
        ? [[col('binCode'), sortOrder]]
        : [
            [literal(`(${latestInvSubq}) IS NULL`), 'ASC'], // 非空在前、空在后
            [literal(latestInvSubq), sortOrder],
            [col('binCode'), 'ASC']
          ]

    let { rows: bins, count } = await (Bin as any).findAndCountAll({
      where: binWhere,
      attributes: [
        'binID',
        'binCode',
        [literal(latestInvSubq), 'latestInvUpdatedAt']
      ],
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
          order:
            sortBy === 'updatedAt'
              ? [['updatedAt', sortOrder]]
              : [['updatedAt', 'DESC']]
        }
      ],
      order: binOrder,
      offset: (page - 1) * limit,
      limit,
      subQuery: false,
      distinct: true,
      raw: false
    })

    if (
      keyword &&
      filteredByBinCode &&
      bins.length === 0 &&
      extraBinIDsByProduct.length > 0
    ) {
      const whereByProduct: WhereOptions = {
        warehouseID,
        type: 'INVENTORY',
        binID: { [Op.in]: extraBinIDsByProduct }
      }

      const ret = await (Bin as any).findAndCountAll({
        where: whereByProduct,
        attributes: [
          'binID',
          'binCode',
          [literal(latestInvSubq), 'latestInvUpdatedAt']
        ],
        include: [
          {
            model: Inventory,
            as: 'inventories',
            required: true,
            separate: true,
            where: { productCode: keyword!.trim() },
            attributes: [
              'inventoryID',
              'binID',
              'productCode',
              'quantity',
              'createdAt',
              'updatedAt'
            ],
            order:
              sortBy === 'updatedAt'
                ? [['updatedAt', sortOrder]]
                : [['updatedAt', 'DESC']]
          }
        ],
        order: binOrder,
        offset: (page - 1) * limit,
        limit,
        subQuery: false,
        distinct: true,
        raw: false
      })
      bins = ret.rows
      count = ret.count
    }

    const totalCount =
      typeof count === 'number'
        ? count
        : Array.isArray(count)
        ? count.length
        : 0

    // 统一返回；空货位的三个字段按你的要求返回 'none'
    const inventories = bins.flatMap((b: any) => {
      const binIDVal = b.get('binID') as string
      const binCodeVal = b.get('binCode') as string
      const invs: any[] = b.inventories || []

      if (!invs.length) {
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
        inventoryID: inv.get('inventoryID'),
        binID: inv.get('binID'),
        productCode: inv.get('productCode'),
        quantity: inv.get('quantity'),
        createdAt: inv.get('createdAt'),
        updatedAt: inv.get('updatedAt'),
        bin: {
          binCode: binCodeVal,
          binID: binIDVal
        }
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
