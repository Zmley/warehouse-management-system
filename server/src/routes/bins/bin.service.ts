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

export const getBinsInWarehouse = async (
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
