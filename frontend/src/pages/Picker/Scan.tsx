import { useEffect, useRef, useState } from 'react'
import { BarcodeScanner } from 'dynamsoft-barcode-reader-bundle'
import { useNavigate } from 'react-router-dom'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { ProductType } from 'types/product'
import ProductCard from './ProductCard'

const Scan = () => {
  const scannerRef = useRef<any>(null)
  const navigate = useNavigate()
  const { fetchBinByCode } = useBin()
  const { fetchProduct } = useProduct()

  const [product, setProduct] = useState<ProductType | null>(null)
  const [showScanner, setShowScanner] = useState(true)

  useEffect(() => {
    const config = {
      license:
        'DLS2eyJoYW5kc2hha2VDb2RlIjoiMTA0MTYzMjYwLVRYbFhaV0pRY205cSIsIm1haW5TZXJ2ZXJVUkwiOiJodHRwczovL21kbHMuZHluYW1zb2Z0b25saW5lLmNvbSIsIm9yZ2FuaXphdGlvbklEIjoiMTA0MTYzMjYwIiwic3RhbmRieVNlcnZlclVSTCI6Imh0dHBzOi8vc2Rscy5keW5hbXNvZnRvbmxpbmUuY29tIiwiY2hlY2tDb2RlIjoxMTQyNzEzNDB9',
      container: '.barcode-scanner-view',
      uiPath:
        'https://cdn.jsdelivr.net/npm/dynamsoft-barcode-reader-bundle@10.5.3000/dist/',
      engineResourcePaths: {
        rootDirectory:
          'https://cdn.jsdelivr.net/npm/dynamsoft-barcode-reader-bundle@10.5.3000/dist/'
      }
    }

    const init = async () => {
      const scanner = new BarcodeScanner(config)
      scannerRef.current = scanner

      const result = await scanner.launch()
      const barcodeText = result.barcodeResults?.[0]?.text?.trim()

      if (!barcodeText) {
        alert('未识别到条码')
        return
      }

      if (/^\d{12}$/.test(barcodeText)) {
        // 是产品码，显示产品
        try {
          const fetched = await fetchProduct(barcodeText)
          if (fetched) {
            setProduct(fetched)
            setShowScanner(false) // 隐藏摄像头
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

      {/* 摄像头区域 */}
      {showScanner && (
        <div
          className='barcode-scanner-view'
          style={{ height: 'calc(100vh - 220px)', width: '100%' }}
        />
      )}

      {/* 产品信息显示区域 */}
      {!showScanner && product && (
        <div style={{ padding: 16 }}>
          <ProductCard product={product} />
        </div>
      )}

      {/* 取消按钮 */}
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
