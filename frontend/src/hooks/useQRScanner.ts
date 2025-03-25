import { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'
import { useNavigate } from 'react-router-dom'
import { processCart } from '../api/cartApi'
import { useProductContext } from '../contexts/cart'

const useQRScanner = (onScanSuccess?: (binID: string) => void) => {
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  const { hasProductInCar, refreshProductStatus, selectedForUnload } =
    useProductContext()

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

  const startScanning = async () => {
    await stopScanning()
    await new Promise(resolve => setTimeout(resolve, 100))
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
                stopScanning()

                const binID = result.data.trim()
                if (binID) {
                  try {
                    const isLoadingToCar = !hasProductInCar

                    const productList = !isLoadingToCar
                      ? selectedForUnload
                      : undefined

                    const response = await processCart(
                      binID,
                      isLoadingToCar,
                      productList
                    )

                    if (response?.success) {
                      const binCode = response.data?.binCode
                      const storageKey = isLoadingToCar
                        ? 'sourceBinCode'
                        : 'destinationBinCode'

                      if (binCode) {
                        localStorage.setItem(storageKey, binCode)
                      }

                      await refreshProductStatus()

                      onScanSuccess?.(binID)
                      stopScanning()
                    } else {
                      console.error('❌ [QrScanner] Unexpected response')
                    }
                  } catch (err: any) {
                    console.error(`❌ [QrScanner] API Error: ${err.message}`)
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
          console.log('▶️ [startScanning] Starting scanner')
          await scannerRef.current.start()
        }
      }
    } catch (error) {
      console.error('❌ [startScanning] Failed to access camera:', error)
    }
  }

  return { videoRef, isScanning, startScanning, stopScanning }
}

export default useQRScanner
