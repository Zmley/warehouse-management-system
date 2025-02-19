import axios from 'axios'

const getProducts = (
  currentPage: number,
  productsPerPage: number,
  category: string,
  sortBy: string,
  sortOrder: string,
  keyword: string
) =>
  axios.get('/api/product/products', {
    params: {
      currentPage,
      productsPerPage,
      category,
      sortBy,
      sortOrder,
      keyword
    }
  })

export { getProducts }
