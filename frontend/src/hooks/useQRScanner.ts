// hooks/useQRScanner.ts
import { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { NotFoundException } from '@zxing/library'

const useQRScanner = (onScanSuccess?: (binCode: string) => void) => {
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const barcodeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  const startScanning = async () => {
    setIsScanning(true)

    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Camera not supported')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // ✅ 启动二维码扫描
        if (!scannerRef.current) {
          scannerRef.current = new QrScanner(
            videoRef.current,
            async result => {
              if (!result.data) {
                return
              }

              await stopScanning()
              const binCode = result.data.trim()
              if (!binCode) return

              try {
                onScanSuccess?.(binCode)
              } catch (err) {
                console.error('❌ [QRScanner] onScanSuccess Error:', err)
              }
            },
            {
              highlightScanRegion: false,
              highlightCodeOutline: false
            }
          )
        }

        await scannerRef.current.start()

        // ✅ 同时启动条形码监听器（降级识别）
        if (!barcodeReaderRef.current) {
          barcodeReaderRef.current = new BrowserMultiFormatReader()

          barcodeReaderRef.current.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            async (result, err) => {
              if (result) {
                await stopScanning()
                const code = result.getText().trim()
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
      }
    } catch (error) {
      console.error('❌ Failed to access camera:', error)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }

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
