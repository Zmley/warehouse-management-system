import { useEffect, useRef } from 'react'
import { BarcodeScanner } from 'dynamsoft-barcode-reader-bundle'
import { useNavigate } from 'react-router-dom'
import { useBin } from 'hooks/useBin'
// import './App.css'

const Scan = () => {
  const scannerRef = useRef<any>(null)
  const navigate = useNavigate()
  const { fetchBinByCode } = useBin()

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

      const barcodeText = result.barcodeResults?.[0]?.text
      if (!barcodeText) {
        alert('未识别到条码')
        return
      }

      const bin = await fetchBinByCode(barcodeText.trim())
      navigate('/create-task', { state: { bin } })
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
      <div
        className='barcode-scanner-view'
        style={{ height: 'calc(100vh - 220px)', width: '100%' }}
      ></div>
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
