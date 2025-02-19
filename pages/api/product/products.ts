import { ProductsSortBy } from 'constant'
import { ProductModel } from 'mongo'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getSortKeyword } from 'utils'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const {
      currentPage,
      productsPerPage,
      category,
      sortOrder,
      keyword,
      sortBy
    } = req.query
    const filter: any = { $and: [{ stock: { $gte: 1 } }] }
    if (category) {
      filter.$and.push({ category: `${category}` })
    }
    if (keyword) {
      filter.$and.push({ name: { $regex: `${keyword}` } })
    }
    const sortKeyWord = getSortKeyword(`${sortBy}`)
    try {
      const products = await ProductModel.find(filter)
        .limit(Number(productsPerPage) + 1)
        .skip(Number(productsPerPage) * (Number(currentPage) - 1))
        .sort({ [`${sortKeyWord}`]: sortOrder as any })

      if (products.length === 0) {
        res.status(200).json({
          message: 'There are no products for these conditions',
          hasNextPage: false
        })
      } else if (products.length < Number(productsPerPage) + 1) {
        res.status(200).json({
          products,
          hasNextPage: false
        })
      } else {
        products.pop()
        res.status(200).json({
          products,
          hasNextPage: true
        })
      }
    } catch (error) {
      console.error(error)
      res.status(500).json({ error })
    }
  }
  if (req.method === 'POST') {
    const products = req.body
    try {
      const product = await ProductModel.create(products)
      res.status(200).json({ product })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error })
    }
  }
}
export default handler
