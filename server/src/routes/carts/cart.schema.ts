import Joi from 'joi'

const ProductQtySchema = Joi.object({
  productCode: Joi.string().trim().required(),
  quantity: Joi.number().integer().min(1).required()
})

const SelectedItemSchema = Joi.object({
  productCode: Joi.string().trim(),
  inventoryID: Joi.string().trim(),
  quantity: Joi.number().integer().min(1).required()
})
  .or('productCode', 'inventoryID')
  .messages({
    'object.missing':
      'Each selected item must include productCode or inventoryID.'
  })

export const CartLoadBodySchema = Joi.object({
  binCode: Joi.string().trim(),
  selectedItems: Joi.array().items(SelectedItemSchema).min(1).optional(),

  productList: Joi.array().items(ProductQtySchema).min(1)
})
  .xor('binCode', 'productList')

  .unknown(false)

const UnloadItemSchema = Joi.object({
  inventoryID: Joi.string().trim(),
  productCode: Joi.string().trim(),

  quantity: Joi.number().integer().min(1).required(),

  merge: Joi.boolean().optional(),

  targetInventoryID: Joi.when('merge', {
    is: true,
    then: Joi.string().trim().required().messages({
      'any.required':
        'When "merge" is true, "targetInventoryID" is required to specify the target inventory to merge into.'
    }),
    otherwise: Joi.string().trim().optional()
  })
})
  .or('inventoryID', 'productCode')
  .messages({
    'object.missing': 'Each item must include inventoryID or productCode',
    'object.or':
      'Each item must include at least one of inventoryID or productCode'
  })
  .unknown(false)

export const CartUnloadBodySchema = Joi.object({
  binCode: Joi.string().trim().required(),
  unloadProductList: Joi.array().items(UnloadItemSchema).min(1).required()
}).unknown(false)
