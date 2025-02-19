/* eslint-disable react-hooks/exhaustive-deps */
import { Product } from 'models'
import { createContext, useEffect, useReducer, useState } from 'react'
import { ProductsSortBy, ProductsSortOrder } from 'constant'
import { getProducts } from 'axios/product'

interface Props {
  children: any
}
interface CachedPage {
  page: number
  products: Product[]
  hasNextPage: boolean
}
interface ProductContext {
  productFilter: {
    currentPage: number
    sortBy: ProductsSortBy.createdAt
    sortOrder: ProductsSortOrder.desc
    productsPerPage: number
    category: string
    keyword: string
  }
  dispatch: any
  cachedProducts: CachedPage[]
  cachedPage: CachedPage | undefined
}
const initialProductFilter = {
  currentPage: 1,
  sortBy: ProductsSortBy.createdAt,
  sortOrder: ProductsSortOrder.desc,
  productsPerPage: 5,
  category: '',
  cachedProducts: [],
  keyword: ''
}
export const ProductContext = createContext<ProductContext>({} as any)
const ProductContextProvider = ({ children }: Props) => {
  const productReducer = (state: any, action: any) => {
    switch (action.type) {
      case 'NEXT_PAGE':
        return { ...state, currentPage: state.currentPage + 1 }
      case 'PREVIOUS_PAGE':
        return { ...state, currentPage: state.currentPage - 1 }
      case 'CHANGE_PRODUCT_FILTER':
        setCachedProducts([])
        return { ...state, [action.index]: action.value, currentPage: 1 }
      case 'CHANGE_SORT_METHOD':
        setCachedProducts([])
        return {
          ...state,
          sortBy: action.sortBy,
          sortOrder: action.sortOrder,
          currentPage: 1
        }
      default:
        return { ...state, [action.index]: action.value }
    }
  }
  const [cachedProducts, setCachedProducts] = useState<CachedPage[]>([])
  const [productFilter, dispatch] = useReducer(
    productReducer,
    initialProductFilter
  )
  const cachedPage = cachedProducts.find(
    cachedProduct => cachedProduct.page === productFilter.currentPage
  )
  const loadProducts = async (
    currentPage: number,
    productsPerPage: number,
    category: string,
    sortBy: string,
    sortOrder: string,
    keyword: string
  ) => {
    const result = await getProducts(
      currentPage,
      productsPerPage,
      category,
      sortBy,
      sortOrder,
      keyword
    )
    if (result.data.products?.length > 0) {
      setCachedProducts([
        ...cachedProducts,
        {
          page: currentPage,
          products: result.data.products,
          hasNextPage: result.data.hasNextPage
        }
      ])
    }
  }
  useEffect(() => {
    loadProducts(
      productFilter.currentPage,
      productFilter.productsPerPage,
      productFilter.category,
      productFilter.sortBy,
      productFilter.sortOrder,
      productFilter.keyword
    )
  }, [
    productFilter.productsPerPage,
    productFilter.category,
    productFilter.sortBy,
    productFilter.sortOrder,
    productFilter.keyword
  ])
  useEffect(() => {
    const getCachedProductIndex = () =>
      cachedProducts.length > 0
        ? cachedProducts.findIndex(
            (cachedPage: CachedPage) =>
              cachedPage.page === productFilter.currentPage
          )
        : -1
    if (getCachedProductIndex() < 0) {
      loadProducts(
        productFilter.currentPage,
        productFilter.productsPerPage,
        productFilter.category,
        productFilter.sortBy,
        productFilter.sortOrder,
        productFilter.keyword
      )
    }
  }, [productFilter.currentPage])

  return (
    <ProductContext.Provider
      value={{
        productFilter,
        dispatch,
        cachedProducts,
        cachedPage
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export default ProductContextProvider
