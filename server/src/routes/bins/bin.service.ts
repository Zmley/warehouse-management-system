import Bin from './bin.model'
import Inventory from 'routes/inventory/inventory.model'
import AppError from 'utils/appError'
import { Op, WhereOptions } from 'sequelize'
import { BinUploadPayload } from 'types/bin'

export const getBinByBinCode = async (binCode: string) => {
  try {
    const bin = await Bin.findOne({
      where: {
        binCode
      }
    })

    if (!bin) {
      throw new AppError(404, `❌${binCode} is not in system so far`)
    }

    return bin
  } catch (error) {
    console.error('Error fetching bin by code:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to fetch bin by code')
  }
}

export const getBinCodesByProductCode = async (
  productCode: string,
  warehouseID: string
): Promise<{ binCode: string; quantity: number }[]> => {
  try {
    const bins = await Bin.findAll({
      where: {
        warehouseID,
        type: 'INVENTORY'
      },
      include: [
        {
          model: Inventory,
          as: 'inventories',
          where: { productCode },
          attributes: ['quantity']
        }
      ],
      attributes: ['binCode']
    })

    if (!bins.length) {
      throw new AppError(404, `❌ No ${productCode} in current warehouse!`)
    }

    return bins.map(bin => ({
      binCode: bin.binCode,
      quantity: bin.inventories?.[0]?.quantity ?? 0
    }))
  } catch (error) {
    console.error('Error fetching binCodes:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to fetch binCodes')
  }
}

export const getBinCodesInWarehouse = async (
  warehouseID: string
): Promise<{ binID: string; binCode: string }[]> => {
  try {
    const bins = await Bin.findAll({
      where: {
        warehouseID,
        type: {
          [Op.in]: ['INVENTORY', 'PICK_UP']
        }
      },
      attributes: ['binID', 'binCode']
    })

    return bins.map(bin => ({
      binID: bin.binID,
      binCode: bin.binCode
    }))
  } catch (error) {
    console.error('Error fetching bins:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to fetch bins')
  }
}

export const getBins = async (
  warehouseID: string,
  page: number,
  limit: number,
  type?: string,
  keyword?: string
) => {
  const offset = (page - 1) * limit

  const baseWhere: WhereOptions = { warehouseID }

  if (type) {
    baseWhere.type = type
  }

  let whereCondition: WhereOptions = { ...baseWhere }

  if (keyword) {
    whereCondition = {
      ...baseWhere,
      [Op.or]: [
        { binCode: { [Op.iLike]: `%${keyword}%` } },
        { defaultProductCodes: { [Op.iLike]: `%${keyword}%` } }
      ]
    }
  }

  const rows = await Bin.findAll({
    where: whereCondition,
    limit,
    offset,
    order: [['binCode', 'ASC']]
  })

  const total = await Bin.count({ where: whereCondition })

  return { data: rows, total }
}

export const addBins = async (binList: BinUploadPayload[]) => {
  const skipped: BinUploadPayload[] = []
  let insertedCount = 0

  const CHUNK_SIZE = 100
  for (let i = 0; i < binList.length; i += CHUNK_SIZE) {
    const chunk = binList.slice(i, i + CHUNK_SIZE)

    const chunkResult = await Promise.all(
      chunk.map(async bin => {
        try {
          await Bin.create({
            warehouseID: bin.warehouseID,
            binCode: bin.binCode,
            type: bin.type,
            defaultProductCodes: bin.defaultProductCodes?.join(',') || null
          })
          return { success: true }
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            skipped.push(bin)
            return { success: false }
          } else {
            throw new AppError(
              500,
              error instanceof Error ? error.message : 'Unknown error'
            )
          }
        }
      })
    )

    insertedCount += chunkResult.filter(r => r.success).length
  }

  return {
    insertedCount,
    skipped
  }
}

export const getPickBinByProductCode = async (
  productCode: string,
  warehouseID: string
) => {
  const bin = await Bin.findOne({
    where: {
      type: 'PICK_UP',
      warehouseID,
      defaultProductCodes: {
        [Op.like]: `%${productCode}%`
      }
    }
  })

  return bin
}

export const isPickUpBin = async (binCode: string): Promise<boolean> => {
  const bin = await Bin.findOne({ where: { binCode } })
  return bin?.type === 'PICK_UP'
}

export const getWarehouseIDByBinCode = async (
  binCode: string
): Promise<string> => {
  const bin = await Bin.findOne({
    where: { binCode },
    attributes: ['warehouseID']
  })

  if (!bin) {
    throw new AppError(404, `❌ Bin with code ${binCode} not found.`)
  }

  return bin.warehouseID
}

export const getBinsByBinCodes = async (
  inventoryList: { binCode: string }[]
) => {
  const binCodes = [...new Set(inventoryList.map(item => item.binCode.trim()))]

  const bins = await Bin.findAll({
    where: {
      binCode: {
        [Op.in]: binCodes
      }
    }
  })

  return bins
}
