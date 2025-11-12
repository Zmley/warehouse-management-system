import Joi from 'joi'

export const GetInventoriesSchema = Joi.object({
  warehouseID: Joi.string().required(),
  binID: Joi.string().optional(),
  page: Joi.number().integer().positive().default(1),
  limit: Joi.number().integer().positive().default(20),
  keyword: Joi.string().trim().allow('').optional(),
  sort: Joi.string().valid('asc', 'desc').default('desc'),
  sortBy: Joi.string().valid('updatedAt', 'binCode').default('updatedAt')
}).unknown(false)

export const UpdateInventoriesSchema = Joi.object({
  updates: Joi.array()
    .items(
      Joi.object({
        inventoryID: Joi.string().required(),
        quantity: Joi.number().integer().min(0).optional(),
        productCode: Joi.string().trim().optional(),
        binID: Joi.string().trim().optional(),
        note: Joi.string().trim().allow('').optional()
      }).custom((v, h) => {
        if (
          v.quantity === undefined &&
          v.productCode === undefined &&
          v.binID === undefined &&
          v.note === undefined
        ) {
          return h.error('any.custom', {
            message:
              'At least one of quantity/productCode/binID must be provided.'
          })
        }
        return v
      }, 'at least one updatable field')
    )
    .min(1)
    .required()
}).unknown(false)

export const AddInventoriesSchema = Joi.array()
  .items(
    Joi.object({
      binID: Joi.string().optional(),
      binCode: Joi.string().required(),
      productCode: Joi.string().required(),
      quantity: Joi.number().integer().min(0).required()
    })
  )
  .min(1)
  .required()

export const InventoryIDParamSchema = Joi.object({
  inventoryID: Joi.string().required()
}).unknown(false)

export const BinCodeParamSchema = Joi.object({
  binCode: Joi.string().required(),
  binID: Joi.string().optional()
}).unknown(false)
