import { ProductsSortBy } from 'constant'

export const getSortKeyword = (sortBy: string) => {
  let sortKeyWord = sortBy
  if (sortBy === ProductsSortBy.price) {
    sortKeyWord = 'options.0.price'
  }
  return sortKeyWord
}
