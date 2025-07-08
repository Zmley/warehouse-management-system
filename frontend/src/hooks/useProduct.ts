import { useState, useCallback } from 'react'
import { getProductByBarCode, getProductCodes } from 'api/product'
import { ProductType } from 'types/product'

export const useProduct = () => {
  const [productCodes, setProductCodes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [product, setProduct] = useState<ProductType | null>(null)

  const loadProducts = useCallback(async () => {
    try {
      const res = await getProductCodes()
      setProductCodes(res.data.productCodes)
    } catch (err) {
      console.error('❌ Failed to load products', err)
    }
  }, [])

  const fetchProduct = async (barCode: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await getProductByBarCode(barCode)

      if (!res || res.data.success === false) {
        setError(res?.data.error || '❌ Product not found')
        setProduct(null)
        return null
      }

      setProduct(res.data.product)
      return res.data.product
    } catch (err: any) {
      setError(err?.response?.data?.error || '❌ Failed to fetch product')
      setProduct(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProductCodes = useCallback(async () => {
    try {
      const res = await getProductCodes()
      if (res.data.success) {
        setProductCodes(res.data.productCodes)
      } else {
        throw new Error('Invalid response')
      }
    } catch (err) {
      console.error('❌ Failed to load product codes', err)
    }
  }, [])

  return {
    productCodes,
    loadProducts,
    error,
    isLoading,
    fetchProduct,
    product,
    fetchProductCodes
  }
}
