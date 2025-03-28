import Bin from './bin.model'
import Inventory from 'routes/inventory/inventory.model'
import AppError from '../../utils/appError'

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

export const getBinByBinCode = async (binCode: string, warehouseID: string) => {
  try {
    const bin = await Bin.findOne({
      where: {
        binCode: binCode,
        warehouseID
      }
    })

    if (!bin) {
      throw new AppError(
        404,
        `❌ No bin found with code: ${binCode} in this warehouse`
      )
    }

    return bin
  } catch (error) {
    console.error('❌ Error fetching bin by code and warehouse:', error)
    throw new AppError(500, '❌ Failed to fetch bin by code and warehouse')
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
