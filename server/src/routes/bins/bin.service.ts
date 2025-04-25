import Bin from './bin.model'
import Inventory from 'routes/inventory/inventory.model'
import AppError from '../../utils/appError'

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

    if (!bins.length) {
      throw new AppError(404, '❌ No bins found in the warehouse')
    }

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

import { Op } from 'sequelize'

interface GetBinsParams {
  warehouseID: string
  type?: string
  keyword?: string
  page: number
  limit: number
}

export const getBins = async ({
  warehouseID,
  type,
  keyword,
  page,
  limit
}: GetBinsParams) => {
  const offset = (page - 1) * limit

  const baseWhere: any = { warehouseID }

  if (type) {
    baseWhere.type = type
  }

  const queryWhere = { ...baseWhere }

  if (keyword) {
    queryWhere.binCode = {
      [Op.iLike]: `%${keyword}%`
    }
  }

  const rows = await Bin.findAll({
    where: queryWhere,
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  })

  const total = await Bin.count({ where: queryWhere }) // ✅ FIXED

  return { data: rows, total }
}

interface BinUploadPayload {
  warehouseID: string
  binCode: string
  type: 'INVENTORY' | 'PICK_UP' | 'CART'
  defaultProductCodes: string[] | null
}

export const addBins = async (binList: BinUploadPayload[]) => {
  const skipped: BinUploadPayload[] = []
  let insertedCount = 0

  const seen = new Set<string>()

  for (const bin of binList) {
    const key = `${bin.warehouseID}__${bin.binCode}`

    if (seen.has(key)) {
      skipped.push(bin)
      continue
    }

    const exists = await Bin.findOne({
      where: {
        warehouseID: bin.warehouseID,
        binCode: bin.binCode
      }
    })

    if (exists) {
      skipped.push(bin)
      continue
    }

    await Bin.create({
      warehouseID: bin.warehouseID,
      binCode: bin.binCode,
      type: bin.type,
      defaultProductCodes: bin.defaultProductCodes?.join(',') || null
    })

    insertedCount++
  }

  return {
    insertedCount,
    skipped
  }
}
