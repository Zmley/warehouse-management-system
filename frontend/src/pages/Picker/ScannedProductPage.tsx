import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProductType } from 'types/product'
import ProductCard from './ProductCard'

const ScannedProductPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const product = (location.state as { product: ProductType })?.product

  if (!product) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>未找到产品信息</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e53935',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          返回 首页
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <ProductCard product={product} />
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e53935',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          取消返回
        </button>
      </div>
    </div>
  )
}

export default ScannedProductPage
