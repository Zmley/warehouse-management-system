import { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'
import { useCartContext } from '../contexts/cart'
import { useCart } from '../hooks/useCart'

const useQRScanner = (onScanSuccess?: (binCode: string) => void) => {
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const { isCartEmpty } = useCartContext()

  const { loadCart, unloadCart } = useCart()

  const startScanning = async () => {
    setIsScanning(true)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera not supported')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        if (!scannerRef.current) {
          scannerRef.current = new QrScanner(
            videoRef.current,
            async result => {
              if (result.data) {
                // Stop scanning to prevent multiple scans
                await stopScanning()

                const binCode = result.data.trim()
                if (binCode) {
                  try {
                    if (isCartEmpty) {
                      loadCart(binCode)
                    } else {
                      unloadCart(binCode)
                    }
                    onScanSuccess?.(binCode)
                  } catch (err) {
                    console.error(`❌ [QrScanner] API Error: ${err}`)
                  }
                }
              }
            },
            {
              highlightScanRegion: false,
              highlightCodeOutline: false
            }
          )
        }

        if (scannerRef.current) {
          await scannerRef.current.start()
        }
      }
    } catch (error) {
      console.error('❌ [startScanning] Failed to access camera:', error)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => {
        track.stop()
      })
      videoRef.current.srcObject = null
    }

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
