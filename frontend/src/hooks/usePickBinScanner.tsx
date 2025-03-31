import { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'

const usePickBinScanner = (onScanSuccess: (binCode: string) => void) => {
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
  }

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    setIsScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        scannerRef.current = new QrScanner(
          videoRef.current,
          async result => {
            const binCode = result.data.trim()
            if (binCode) {
              console.log('📦 Scanned binCode:', binCode)
              await stopScanning()
              onScanSuccess(binCode)
            }
          },
          {
            highlightScanRegion: false,
            highlightCodeOutline: false
          }
        )

        await scannerRef.current.start()
      }
    } catch (err) {
      console.error('❌ Failed to start bin scan:', err)
      alert('Camera access denied or unavailable.')
    }
  }

  return {
    videoRef,
    isScanning,
    startScanning,
    stopScanning
  }
}

export default usePickBinScanner
