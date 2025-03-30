import Bin from './bin.model'
import AppError from '../../utils/appError'
import Inventory from 'routes/inventory/inventory.model'

export const getMatchBinCodesByProductCode = async (
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
          where: { productCode },
          attributes: []
        }
      ],
      attributes: ['binCode']
    })

    if (!inventories.length) {
      throw new AppError(
        404,
        'No bins found for the given productCode and warehouse'
      )
    }

    const binCodes = inventories.map(bin => bin.binCode)
    return binCodes
  } catch (error) {
    console.error('Error fetching binCodes:', error)
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError(500, 'Failed to fetch binCodes')
  }
}

export const getBinByBinID = async (binID: string): Promise<Bin> => {
  try {
    const bin = await Bin.findOne({
      where: { binID }
    })

    if (!bin) {
      throw new AppError(404, `No bin found with binID: ${binID}`)
    }

    return bin
  } catch (error) {
    console.error('Error fetching bin by binID:', error)

    // 如果是自定义的错误，则直接抛出
    if (error instanceof AppError) {
      throw error
    }

    // 否则抛出一个通用的错误
    throw new AppError(500, 'Failed to fetch bin by binID')
  }
}
