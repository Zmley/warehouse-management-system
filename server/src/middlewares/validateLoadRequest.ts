import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

const schema = Joi.object({
  binCode: Joi.string(),
  productCode: Joi.string(),
  quantity: Joi.number().integer().min(1)
})
  .xor('binCode', 'productCode')
  .with('productCode', 'quantity')

export const validateLoadRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = schema.validate(req.body)

  if (error) {
    return res.status(400).json({
      success: false,
      message: `❌ Invalid request: ${error.message}`
    })
  }

  next()
}
