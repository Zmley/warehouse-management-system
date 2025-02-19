export enum ProductsSortBy {
  createdAt = 'createdAt',
  price = 'price'
}
export enum ProductsSortOrder {
  asc = 'asc',
  desc = 'desc'
}
export const ProductsSortMethod = {
  newArrivals: { value: 'new-arrivals', label: 'New Arrivals' },
  priceIncrease: { value: 'price-increase', label: 'Price (low to high)' },
  priceDecrease: { value: 'price-decrease', label: 'Price (high to low)' }
}
