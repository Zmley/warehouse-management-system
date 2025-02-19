export type Product = {
  _id: string
  name: string
  description?: string
  coverImage: ProductImage
  quantity?: number
  options: Option[]
  selectedOption?: Option
  images?: ProductImage[]
  taxable: boolean
  stock: number
  category?: string
}

export type Option = {
  _id: string
  name: string
  price: number
  priority: number
}

export type ProductImage = {
  _id: string
  name: string
  url: string
  priority?: number
}
