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
): Promise<string[]> => {
  try {
    const inventories = await Bin.findAll({
      where: {
        warehouseID,
        type: 'INVENTORY'
      },
      include: [
        {
          model: Inventory,
          as: 'inventories',
          where: { productCode },
          attributes: []
        }
      ],
      attributes: ['binCode']
    })

    if (!inventories.length) {
      throw new AppError(404, `❌ No ${productCode} in current warehouse!`)
    }

    return inventories.map(bin => bin.binCode)
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
        type: 'INVENTORY'
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

  await Promise.all(
    binList.map(async bin => {
      try {
        await Bin.create({
          warehouseID: bin.warehouseID,
          binCode: bin.binCode,
          type: bin.type,
          defaultProductCodes: bin.defaultProductCodes?.join(',') || null
        })
        insertedCount++
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          skipped.push(bin)
        } else {
          throw new AppError(
            500,
            error instanceof Error ? error.message : 'Unknown error'
          )
        }
      }
    })
  )

  return {
    insertedCount,
    skipped
  }
}
