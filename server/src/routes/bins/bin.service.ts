import Bin from './bin.model'
import Inventory from 'routes/inventory/inventory.model'
import AppError from 'utils/appError'
import { Op, WhereOptions } from 'sequelize'
import { BinUploadPayload } from 'types/bin'

export const getBinByBinCode = async (binCode: string) => {
  try {
    console.log('🔍 Fetching bin with code:', binCode)

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
  let insertedCount = 0
  let updatedCount = 0

  const CHUNK_SIZE = 100

  for (let i = 0; i < binList.length; i += CHUNK_SIZE) {
    const chunk = binList.slice(i, i + CHUNK_SIZE)

    await Promise.all(
      chunk.map(async bin => {
        const { warehouseID, binCode, type, defaultProductCodes } = bin
        const joinedCodes = defaultProductCodes?.join(',') || null

        const [record, created] = await Bin.findOrCreate({
          where: { binCode, warehouseID },
          defaults: { type, defaultProductCodes: joinedCodes }
        })

        if (created) {
          insertedCount++
        } else {
          await record.update({ type, defaultProductCodes: joinedCodes })
          updatedCount++
        }
      })
    )
  }

  return {
    insertedCount,
    updatedCount
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

export const updateDefaultProductCodes = async (
  binID: string,
  defaultProductCodes: string
) => {
  const targetBin = await Bin.findByPk(binID)
  if (!targetBin) return null

  const warehouseID = targetBin.warehouseID

  const incomingCodes = defaultProductCodes
    .split(',')
    .map(c => c.trim())
    .filter(c => c)

  for (const productCode of incomingCodes) {
    const conflictingBin = await Bin.findOne({
      where: {
        binID: { [Op.ne]: binID },
        warehouseID,
        defaultProductCodes: {
          [Op.like]: `%${productCode}%`
        }
      }
    })

    if (conflictingBin) {
      const originalList = (conflictingBin.defaultProductCodes || '')
        .split(',')
        .map(c => c.trim())
        .filter(c => c)

      const newList = originalList.filter(c => c !== productCode)
      await conflictingBin.update({
        defaultProductCodes: newList.length > 0 ? newList.join(',') : null
      })
    }
  }

  const updated = await targetBin.update({
    defaultProductCodes:
      incomingCodes.length > 0 ? incomingCodes.join(',') : null
  })

  return updated
}

export const deleteBinByBInID = async (binID: string): Promise<boolean> => {
  const result = await Bin.destroy({ where: { binID } })
  return result > 0
}
