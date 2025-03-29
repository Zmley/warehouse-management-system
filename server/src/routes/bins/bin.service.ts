import Bin from './bin.model'
import AppError from '../../utils/appError'
import Inventory from 'routes/inventory/inventory.model'

export const getDefaultProduct = async (binID: string): Promise<string> => {
  try {
    const bin = await Bin.findOne({
      where: { binID },
      attributes: ['defaultProductID']
    })

    if (!bin || !bin.defaultProductCodes) {
      throw new AppError(404, '❌ No product found in the given bin')
    }

    return bin.defaultProductCodes
  } catch (error) {
    console.error('❌ Error fetching picker product:', error)
    throw new AppError(500, '❌ Failed to fetch picker product')
  }
}

export const getBinByBinID = async (binID: string) => {
  try {
    const bin = await Bin.findOne({
      where: { binID }
    })

    return bin
  } catch (error) {
    console.error('❌ Error fetching bin:', error)
    throw new AppError(500, '❌ Failed to fetch bin')
  }
}

export const getBinCodesByProductCodeAndWarehouse = async (
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
