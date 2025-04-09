import Bin from './bin.model'
import Inventory from 'routes/inventory/inventory.model'
import AppError from '../../utils/appError'

export const getBinByBinCode = async (binCode: string, warehouseID: string) => {
  const bin = await Bin.findOne({
    where: {
      binCode,
      warehouseID
    }
  })

  if (!bin) {
    throw new AppError(404, `❌ This "${binCode}" is not in this warehouse`)
  }

  return bin
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
          where: { productCode },
          attributes: []
        }
      ],
      attributes: ['binCode']
    })

    if (!inventories.length) {
      throw new Error('No bins found for the given productCode and warehouse')
    }

    const binCodes = inventories.map(bin => bin.binCode)

    return binCodes
  } catch (error) {
    console.error('Error fetching binCodes:', error)
    throw new Error('Failed to fetch binCodes')
  }
}
