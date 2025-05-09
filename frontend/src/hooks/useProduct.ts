import { useState, useCallback } from 'react'
import { getProductByBarCode, getProductCodes } from 'api/productApi'
import { ProductType } from 'types/product'

export const useProduct = () => {
  const [productCodes, setProductCodes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [product, setProduct] = useState<ProductType | null>(null)

  const loadProducts = useCallback(async () => {
    try {
      const res = await getProductCodes()
      setProductCodes(res.productCodes)
    } catch (err) {
      console.error('❌ Failed to load products', err)
    }
  }, [])

  const fetchProduct = async (barCode: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await getProductByBarCode(barCode)

      if (!res || res.success === false) {
        setError(res?.error || '❌ Product not found')
        setProduct(null)
        return null
      }

      setProduct(res.product)
      return res.product
    } catch (err: any) {
      setError(err?.response?.data?.error || '❌ Failed to fetch product')
      setProduct(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { productCodes, loadProducts, error, isLoading, fetchProduct, product }
}
