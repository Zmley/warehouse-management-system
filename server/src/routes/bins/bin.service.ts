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
      // If it's already an AppError, rethrow it
      throw error
    }
    // If it's any other error, wrap it in an AppError
    throw new AppError(500, 'Failed to fetch binCodes')
  }
}
