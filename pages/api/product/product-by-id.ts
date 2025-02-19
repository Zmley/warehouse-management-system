import { ProductModel } from 'mongo'
import type { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const { productId } = req.query
    try {
      const product = await ProductModel.findOne({ _id: productId })
      if (!product) {
        res.status(200).json({
          message: 'There are no product for this id'
        })
      } else {
        res.status(200).json({
          product
        })
      }
    } catch (error) {
      console.error(error)
      res.status(500).json({ error })
    }
  } else {
    res.status(405).send({ message: 'Only GET requests allowed' })
    return
  }
}
export default handler
