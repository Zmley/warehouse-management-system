import { useCallback, useEffect, useRef } from 'react'

type ScannerInstance = {
  router: any
  cameraEnhancer: any
}

type UseDynamsoftScannerArgs = {
  enabled: boolean
  license: string
  containerSelector: string
  onDetected: (text: string) => void
  onError?: (err: unknown) => void
  capturePreset?: string
}

export const useDynamsoftScanner = ({
  enabled,
  license,
  containerSelector,
  onDetected,
  onError,
  capturePreset = 'ReadBarcodes_SpeedFirst'
}: UseDynamsoftScannerArgs) => {
  const scannerRef = useRef<ScannerInstance | null>(null)
  const scannedRef = useRef(false)

  const stop = useCallback(() => {
    try {
      scannerRef.current?.router?.stopCapturing()
      scannerRef.current?.cameraEnhancer?.close()
    } catch {}
  }, [])

  const reset = useCallback(() => {
    scannedRef.current = false
  }, [])

  useEffect(() => {
    if (!enabled) return
    let router: any
    let cameraEnhancer: any

    const init = async () => {
      try {
        const { Dynamsoft } = window as any
        await Dynamsoft.License.LicenseManager.initLicense(license)
        await Dynamsoft.Core.CoreModule.loadWasm(['DBR'])

        const cameraView = await Dynamsoft.DCE.CameraView.createInstance()
        cameraEnhancer =
          await Dynamsoft.DCE.CameraEnhancer.createInstance(cameraView)
        document
          .querySelector(containerSelector)
          ?.append(cameraView.getUIElement())

        router = await Dynamsoft.CVR.CaptureVisionRouter.createInstance()
        await router.setInput(cameraEnhancer)

        const receiver = new Dynamsoft.CVR.CapturedResultReceiver()
        receiver.onCapturedResultReceived = async (result: any) => {
          if (scannedRef.current) return
          for (const item of result.items) {
            const text = item.text?.trim()
            if (text) {
              scannedRef.current = true
              try {
                await router.stopCapturing()
                await cameraEnhancer.close()
              } catch {}
              onDetected(text)
              break
            }
          }
        }

        router.addResultReceiver(receiver)
        await cameraEnhancer.open()
        await router.startCapturing(capturePreset)

        scannerRef.current = { router, cameraEnhancer }
      } catch (err) {
        onError?.(err)
      }
    }

    init()
    return () => {
      stop()
      scannerRef.current = null
      scannedRef.current = false
    }
  }, [capturePreset, containerSelector, enabled, license, onDetected, onError, stop])

  return { stop, reset }
}
