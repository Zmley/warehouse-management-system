import Bin from './bin.model'
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
