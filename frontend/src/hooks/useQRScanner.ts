import { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'
import { useNavigate } from 'react-router-dom'
import { processCart } from '../api/cartApi'
import { useCargoContext } from '../contexts/cargo'

const useQRScanner = (onScanSuccess?: (binID: string) => void) => {
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  const { hasCargoInCar, refreshCargoStatus, selectedForUnload } =
    useCargoContext()

  const stopScanning = async () => {
    console.log('📷 [stopScanning] Called')

    if (scannerRef.current) {
      console.log('🛑 [stopScanning] Stopping scanner...')
      await scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      console.log('🛑 [stopScanning] Stopping tracks...')
      stream.getTracks().forEach(track => {
        console.log(`🛑 [stopScanning] Stopping track: ${track.kind}`)
        track.stop()
      })
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
  }

  useEffect(() => {
    console.log('📦 [useEffect] QR Scanner mounted')
    return () => {
      console.log('📦 [useEffect cleanup] Unmounting - calling stopScanning')
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    console.log('🚀 [startScanning] Called')
    await stopScanning()
    await new Promise(resolve => setTimeout(resolve, 100))
    setIsScanning(true)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera not supported')
      return
    }

    try {
      console.log('📷 [startScanning] Getting media stream...')
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
                console.log('✅ [QrScanner] Scanned:', result.data)
                stopScanning()

                const binID = result.data.trim()
                if (binID) {
                  try {
                    const isLoadingToCar = !hasCargoInCar
                    console.log(
                      `[QR] Decided action: ${
                        isLoadingToCar ? 'LOAD' : 'UNLOAD'
                      }`
                    )

                    const productList = !isLoadingToCar
                      ? selectedForUnload
                      : undefined

                    const response = await processCart(
                      binID,
                      isLoadingToCar,
                      productList
                    )

                    if (response?.success) {
                      console.log('✅ [QrScanner] Task success, navigating')
                      await refreshCargoStatus()
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
