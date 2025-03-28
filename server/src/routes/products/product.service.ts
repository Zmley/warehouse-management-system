// 📁 src/routes/products/product.service.ts
import { Product } from './product.model'

export const getAllProductCodesService = async (): Promise<string[]> => {
  const products = await Product.findAll({
    attributes: ['productCode'],
    raw: true
  })
  return products.map(p => p.productCode)
}
