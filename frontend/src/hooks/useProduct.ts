import { useState, useCallback } from 'react'
import { getProductCodes } from '../api/productApi'

export const useProduct = () => {
  const [productCodes, setProductCodes] = useState<string[]>([])

  const loadProducts = useCallback(async () => {
    try {
      const res = await getProductCodes()
      setProductCodes(res.productCodes)
    } catch (err) {
      console.error('❌ Failed to load products', err)
    }
  }, [])

  return { productCodes, loadProducts }
}
