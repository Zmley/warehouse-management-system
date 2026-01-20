// src/pages/PickerScan/CameraPanel.tsx (or your path)
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Paper, Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

declare global {
  interface Window {
    Dynamsoft: any
  }
}

const license = process.env.REACT_APP_DYNAMSOFT_LICENSE || ''

export type CameraHandle = {
  stop: () => void
}

type Props = {
  onScan: (code: string) => void | Promise<void>
  error: string | null
  setError: (e: string | null) => void
}

const CameraPanel = forwardRef<CameraHandle, Props>(
  ({ onScan, error, setError }, ref) => {
    const { t } = useTranslation()

    const onScanRef = useRef(onScan)
    useEffect(() => {
      onScanRef.current = onScan
    }, [onScan])

    const scannerRef = useRef<{
      router: any
      cameraEnhancer: any
      cameraView: any
      receiver: any
    } | null>(null)

    const initializedRef = useRef(false)
    const runningRef = useRef(false)

    const stopCamera = () => {
      const inst = scannerRef.current
      if (!inst) return
      try {
        inst.router?.removeResultReceiver?.(inst.receiver)
      } catch {}
      try {
        inst.router?.stopCapturing?.()
      } catch {}
      try {
        inst.cameraEnhancer?.close?.()
      } catch {}
      try {
        inst.router?.dispose?.()
      } catch {}
      try {
        inst.cameraEnhancer?.dispose?.()
      } catch {}
      try {
        inst.cameraView?.dispose?.()
      } catch {}
      scannerRef.current = null
      runningRef.current = false
    }

    useImperativeHandle(ref, () => ({ stop: stopCamera }), [])

    useEffect(() => {
      if (initializedRef.current) return
      initializedRef.current = true

      let mounted = true

      ;(async () => {
        try {
          const { Dynamsoft } = window
          await Dynamsoft.License.LicenseManager.initLicense(license)
          await Dynamsoft.Core.CoreModule.loadWasm(['DBR'])

          const cameraView = await Dynamsoft.DCE.CameraView.createInstance()
          const cameraEnhancer =
            await Dynamsoft.DCE.CameraEnhancer.createInstance(cameraView)

          const mount = document.querySelector('.barcode-scanner-view')
          if (mounted && mount instanceof HTMLElement) {
            mount.innerHTML = ''
            mount.append(cameraView.getUIElement())
          }

          const router =
            await Dynamsoft.CVR.CaptureVisionRouter.createInstance()
          await router.setInput(cameraEnhancer)
          const settings = await router.getSimplifiedSettings(
            'ReadBarcodes_SpeedFirst'
          )
          settings.barcodeSettings.barcodeFormatIds =
            Dynamsoft.DBR.EnumBarcodeFormat.BF_ONED |
            Dynamsoft.DBR.EnumBarcodeFormat.BF_QR_CODE
          await router.updateSettings('ReadBarcodes_SpeedFirst', settings)

          const receiver = new Dynamsoft.CVR.CapturedResultReceiver()
          receiver.onCapturedResultReceived = async (result: any) => {
            if (!mounted || !runningRef.current) return
            for (const item of result.items || []) {
              const text = item?.text?.trim()
              if (text) {
                try {
                  await onScanRef.current(text)
                } finally {
                  stopCamera()
                }
                break
              }
            }
          }

          router.addResultReceiver(receiver)
          await cameraEnhancer.open()
          await router.startCapturing('ReadBarcodes_SpeedFirst')

          scannerRef.current = { router, cameraEnhancer, cameraView, receiver }
          runningRef.current = true
        } catch (err) {
          console.error('Scanner init failed:', err)
          setError(t('scan.operationError'))
        }
      })()

      return () => {
        mounted = false
        stopCamera()
      }
    }, [setError, t])

    return (
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid #e6ebf2',
          bgcolor: 'rgba(255,255,255,0.9)'
        }}
      >
        <Box
          className='barcode-scanner-view'
          sx={{
            height: { xs: 220, sm: 280 },
            width: '100%',
            borderRadius: 2,
            overflow: 'hidden',
            border: '2px solid #ccc',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        />
        {error && (
          <Typography
            color='error'
            mt={1.25}
            fontWeight='bold'
            textAlign='center'
          >
            {error}
          </Typography>
        )}
      </Paper>
    )
  }
)

export default CameraPanel
