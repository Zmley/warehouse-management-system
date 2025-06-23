import { useEffect, useRef, useState } from 'react'
import { BarcodeScanner } from 'dynamsoft-barcode-reader-bundle'
import { useNavigate } from 'react-router-dom'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { ProductType } from 'types/product'
import ProductCard from './ProductCard'
import { dynamsoftConfig } from 'utils/dynamsoftConfig'

const Scan = () => {
  const scannerRef = useRef<any>(null)
  const navigate = useNavigate()
  const { fetchBinByCode } = useBin()
  const { fetchProduct } = useProduct()

  const [product, setProduct] = useState<ProductType | null>(null)
  const [showScanner, setShowScanner] = useState(true)

  useEffect(() => {
    const init = async () => {
      const scanner = new BarcodeScanner(dynamsoftConfig)
      scannerRef.current = scanner

      const result = await scanner.launch()
      const barcodeText = result.barcodeResults?.[0]?.text?.trim()

      if (!barcodeText) {
        alert('未识别到条码')
        return
      }

      if (/^\d{12}$/.test(barcodeText)) {
        try {
          const fetched = await fetchProduct(barcodeText)
          if (fetched) {
            setProduct(fetched)
            setShowScanner(false)
          } else {
            alert('未找到该产品')
          }
        } catch (err) {
          console.error('查询产品失败:', err)
          alert('查询产品失败')
        }
      } else {
        // 是二维码 → 跳转创建任务
        try {
          const bin = await fetchBinByCode(barcodeText)
          navigate('/create-task', { state: { bin } })
        } catch (err) {
          console.error('Bin查找失败:', err)
          alert('无效的Bin码')
        }
      }
    }

    init()

    return () => {
      if (scannerRef.current?.hide) {
        scannerRef.current.hide()
      }
    }
  }, [])

  const handleCancel = () => {
    navigate('/')
    window.location.reload()
  }

  return (
    <div className='barcode-scanner-hello-world-page'>
      <div className='barcode-scanner-title'></div>

      {showScanner && (
        <div
          className='barcode-scanner-view'
          style={{ height: 'calc(100vh - 220px)', width: '100%' }}
        />
      )}

      {!showScanner && product && (
        <div style={{ padding: 16 }}>
          <ProductCard product={product} />
        </div>
      )}

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button
          onClick={handleCancel}
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

export default Scan
