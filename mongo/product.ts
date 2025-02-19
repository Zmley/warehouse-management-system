import { Schema, model, models } from 'mongoose'

const optionSchema = new Schema({
  name: String,
  price: { type: Number, required: true },
  priority: Number
})
const imageSchema = new Schema({
  name: String,
  url: { type: String, required: true },
  priority: Number
})
const productSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    coverImage: imageSchema,
    description: String,
    stock: Number,
    options: [optionSchema],
    images: [imageSchema]
  },
  { timestamps: true }
)

const ProductModel = models.Product || model('Product', productSchema)

export default ProductModel
