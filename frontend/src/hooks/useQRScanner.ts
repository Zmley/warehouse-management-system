import { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'
import { useNavigate } from 'react-router-dom'
import { loadToCart, unloadFromCart } from '../api/cartApi'
import { useCartContext } from '../contexts/cart'
import { useWorkerTaskContext } from '../contexts/workerTask'

const useQRScanner = (onScanSuccess?: (binCode: string) => void) => {
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  const { setDestinationBinCode, fetchBinCodes } = useWorkerTaskContext()

  const { hasProductInCar, getMyCart, selectedForUnload } = useCartContext()

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
                // stopScanning()

                const binCode = result.data.trim()
                if (binCode) {
                  try {
                    const isLoadingToCar = !hasProductInCar

                    const productList = !isLoadingToCar ? selectedForUnload : []

                    const response = isLoadingToCar
                      ? await loadToCart(binCode)
                      : await unloadFromCart(binCode, productList)

                    if (response?.success) {
                      if (isLoadingToCar) {
                        await fetchBinCodes()
                      } else {
                        setDestinationBinCode(binCode)
                      }

                      await getMyCart()

                      onScanSuccess?.(binCode)
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
