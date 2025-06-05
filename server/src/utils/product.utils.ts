import { WhereOptions } from 'sequelize/types'
import { Op } from 'sequelize'
import { ProductUploadInput } from 'types/product'
import Product from 'routes/products/product.model'
import AppError from './appError'

export const getOffset = (page: number, limit: number): number => {
  return (page - 1) * limit
}

export const buildProductWhereClause = (keyword?: string): WhereOptions => {
  if (keyword) {
    return {
      productCode: {
        [Op.iLike]: `%${keyword}%`
      }
    }
  }
  return {}
}

export const sanitizeProductItem = (item: ProductUploadInput) => {
  return {
    productCode: item.productCode?.trim(),
    barCode: item.barCode?.trim(),
    boxType: item.boxType?.trim()
  }
}

export const handleProductInsertion = async (
  item: ProductUploadInput,
  incrementInserted: () => void,
  incrementUpdated: () => void
) => {
  const { productCode, barCode, boxType } = sanitizeProductItem(item)

  if (!productCode) {
    return
  }

  try {
    await Product.create({ productCode, barCode, boxType })
    incrementInserted()
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      await Product.update({ barCode, boxType }, { where: { productCode } })
      incrementUpdated()
    } else {
      throw new AppError(
        500,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
}
