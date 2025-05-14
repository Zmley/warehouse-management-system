import { useState, useRef, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { NotFoundException } from '@zxing/library'

const useQRScanner = (onScanSuccess?: (binCode: string) => void) => {
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const barcodeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const hasScannedRef = useRef(false)

  const startScanning = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Camera not supported')
      return
    }

    setIsScanning(true)
    hasScannedRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        if (!barcodeReaderRef.current) {
          barcodeReaderRef.current = new BrowserMultiFormatReader()
        }

        barcodeReaderRef.current.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          async (result, err) => {
            if (result && !hasScannedRef.current) {
              hasScannedRef.current = true
              const code = result.getText().trim()
              await stopScanning()
              try {
                onScanSuccess?.(code)
              } catch (err) {
                console.error('❌ [BarcodeReader] onScanSuccess Error:', err)
              }
            } else if (err && !(err instanceof NotFoundException)) {
              console.error('❌ Barcode read error:', err)
            }
          }
        )
      }
    } catch (error) {
      console.error('❌ Failed to access camera:', error)
    }
  }

  const stopScanning = async () => {
    if (barcodeReaderRef.current) {
      try {
        ;(barcodeReaderRef.current as any).reset()
      } catch (e) {
        console.warn('⚠️ Barcode reader reset failed:', e)
      }
      barcodeReaderRef.current = null
    }

    const stream = videoRef.current?.srcObject as MediaStream
    stream?.getTracks().forEach(track => track.stop())
    if (videoRef.current) videoRef.current.srcObject = null

    setIsScanning(false)
  }

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return { videoRef, isScanning, startScanning, stopScanning }
}

export default useQRScanner
