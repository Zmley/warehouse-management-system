import React, { useEffect, useRef, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  GlobalStyles
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'

declare global {
  interface Window {
    Dynamsoft: any
  }
}

const license = process.env.REACT_APP_DYNAMSOFT_LICENSE || ''

type Props = {
  onScanned: (text: string) => void
  onClose: () => void
  allowManualFallback?: boolean
  placeholder?: string
}

export default function ScanPanelLite({
  onScanned,
  onClose,
  allowManualFallback = true,
  placeholder = '支持多对：PRODUCT:QTY，逗号/换行/分号分隔'
}: Props) {
  const scannerRef = useRef<any>(null)
  const scannedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState('')

  const stopScanner = () => {
    try {
      scannerRef.current?.router?.stopCapturing()
      scannerRef.current?.cameraEnhancer?.close()
    } catch {}
  }

  useEffect(() => {
    const init = async () => {
      try {
        const { Dynamsoft } = window
        if (!Dynamsoft || !license) {
          setError('相机不可用或缺少 License，已启用手动输入。')
          return
        }
        await Dynamsoft.License.LicenseManager.initLicense(license)
        await Dynamsoft.Core.CoreModule.loadWasm(['DBR'])

        const cameraView = await Dynamsoft.DCE.CameraView.createInstance()
        const cameraEnhancer =
          await Dynamsoft.DCE.CameraEnhancer.createInstance(cameraView)

        const host = document.getElementById('lite-scanner-view')
        const ui = cameraView.getUIElement()
        if (host) {
          host.innerHTML = ''
          host.append(ui)
          Object.assign(ui.style, {
            width: '100%',
            height: '100%',
            border: '0'
          } as CSSStyleDeclaration)
          try {
            cameraView.setVideoFit?.('cover')
          } catch {}
        }

        const router = await Dynamsoft.CVR.CaptureVisionRouter.createInstance()
        await router.setInput(cameraEnhancer)

        const receiver = new Dynamsoft.CVR.CapturedResultReceiver()
        receiver.onCapturedResultReceived = async (result: any) => {
          if (scannedRef.current) return
          for (const item of result.items) {
            const text = item.text?.trim()
            if (text) {
              scannedRef.current = true
              stopScanner()
              onScanned(text)
              break
            }
          }
        }

        router.addResultReceiver(receiver)
        await cameraEnhancer.open()
        await router.startCapturing('ReadBarcodes_SpeedFirst')

        scannerRef.current = { router, cameraEnhancer }
      } catch (e) {
        console.error(e)
        setError('相机初始化失败，已启用手动输入。')
      }
    }

    init()
    return () => stopScanner()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box>
      <GlobalStyles
        styles={{
          '#lite-scanner-view, #lite-scanner-view > *': {
            width: '100%',
            height: '100%'
          },
          '#lite-scanner-view video': {
            width: '100% !important',
            height: '100% !important',
            objectFit: 'cover !important'
          },
          '#lite-scanner-view .dce-ui-badge, #lite-scanner-view .dce-msg-label':
            {
              display: 'none !important'
            }
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 16, flex: 1 }}>
          扫描
        </Typography>
        <IconButton size='small' onClick={onClose}>
          <CloseIcon fontSize='small' />
        </IconButton>
      </Box>

      <Paper
        elevation={1}
        sx={{ p: 1, mb: 1, borderRadius: 2, textAlign: 'center' }}
      >
        <Box
          id='lite-scanner-view'
          sx={{
            width: '100%',
            maxWidth: 520,
            mx: 'auto',
            borderRadius: 2,
            overflow: 'hidden',
            border: '2px solid #e5e7eb',
            aspectRatio: '3 / 4',
            height: { xs: 'auto', sm: 360 }
          }}
        />
      </Paper>

      {error && allowManualFallback && (
        <Box>
          <Typography variant='caption' color='text.secondary'>
            {error}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder={placeholder}
            value={manual}
            onChange={e => setManual(e.target.value)}
            sx={{ mt: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant='contained'
              startIcon={<QrCodeScannerIcon />}
              onClick={() => manual.trim() && onScanned(manual)}
              sx={{ textTransform: 'none', fontWeight: 800 }}
            >
              提交文本
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}
