import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import { useCart } from 'hooks/useCart'
import { ScanMode } from 'constants/index'

// Dynamsoft 是通过 script 全局引入的
declare global {
  interface Window {
    Dynamsoft: any
  }
}

const license =
  'DLS2eyJoYW5kc2hha2VDb2RlIjoiMTA0MTYzMjYwLVRYbFhaV0pRY205cSIsIm1haW5TZXJ2ZXJVUkwiOiJodHRwczovL21kbHMuZHluYW1zb2Z0b25saW5lLmNvbSIsIm9yZ2FuaXphdGlvbklEIjoiMTA0MTYzMjYwIiwic3RhbmRieVNlcnZlclVSTCI6Imh0dHBzOi8vc2Rscy5keW5hbXNvZnRvbmxpbmUuY29tIiwiY2hlY2tDb2RlIjoxMTQyNzEzNDB9'

const ScanBasic = () => {
  const scannerRef = useRef<any>(null)
  const scannedRef = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { loadCart, unloadCart, error } = useCart()

  const scanMode: ScanMode = location.state?.mode || ScanMode.LOAD
  const unloadProductList = location.state?.unloadProductList || []

  const [manualMode, setManualMode] = useState(false)
  const [manualInput, setManualInput] = useState('')

  useEffect(() => {
    if (manualMode) return

    const loadAndInit = async () => {
      try {
        const { Dynamsoft } = window
        await Dynamsoft.License.LicenseManager.initLicense(license)
        await Dynamsoft.Core.CoreModule.loadWasm(['DBR'])

        const cameraView = await Dynamsoft.DCE.CameraView.createInstance()
        const cameraEnhancer =
          await Dynamsoft.DCE.CameraEnhancer.createInstance(cameraView)

        document
          .getElementById('scanner-view')
          ?.append(cameraView.getUIElement())

        const router = await Dynamsoft.CVR.CaptureVisionRouter.createInstance()
        await router.setInput(cameraEnhancer)

        const receiver = new Dynamsoft.CVR.CapturedResultReceiver()
        receiver.onCapturedResultReceived = async (result: any) => {
          if (scannedRef.current) return

          for (const item of result.items) {
            const text = item.text?.trim()
            if (text) {
              scannedRef.current = true

              try {
                const res =
                  scanMode === ScanMode.UNLOAD
                    ? await unloadCart(text, unloadProductList)
                    : await loadCart({ binCode: text })

                if (res.success) {
                  await router.stopCapturing()
                  await cameraEnhancer.close()
                  navigate('/', { state: { openCart: true } })
                } else {
                  scannedRef.current = false // 允许重新扫
                }
              } catch (err) {
                console.error('❌ 扫码操作失败:', err)
                scannedRef.current = false
              }

              break
            }
          }
        }

        router.addResultReceiver(receiver)
        await cameraEnhancer.open()
        await router.startCapturing('ReadBarcodes_SpeedFirst')

        scannerRef.current = { router, cameraEnhancer }
      } catch (err) {
        console.error('❌ Scanner init failed:', err)
      }
    }

    loadAndInit()

    return () => {
      scannerRef.current?.router?.stopCapturing()
      scannerRef.current?.cameraEnhancer?.close()
    }
  }, [navigate, loadCart, unloadCart, scanMode, unloadProductList, manualMode])

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return
    try {
      const res =
        scanMode === ScanMode.UNLOAD
          ? await unloadCart(manualInput.trim(), unloadProductList)
          : await loadCart({ binCode: manualInput.trim() })

      if (res.success) {
        navigate('/', { state: { openCart: true } })
      }
    } catch (err) {
      console.error('❌ 手动操作失败:', err)
    }
  }

  const handleCancel = () => {
    scannerRef.current?.router?.stopCapturing()
    scannerRef.current?.cameraEnhancer?.close()
    navigate('/')
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h6' mb={2} textAlign='center'>
        {scanMode === ScanMode.UNLOAD ? '📤 Scan to Unload' : '📦 Scan to Load'}
      </Typography>

      {!manualMode ? (
        <>
          <Box
            id='scanner-view'
            sx={{
              width: '100%',
              maxWidth: 500,
              height: 320,
              border: '2px solid #ccc',
              borderRadius: 2,
              overflow: 'hidden',
              mx: 'auto'
            }}
          />

          <Button
            fullWidth
            variant='outlined'
            onClick={() => {
              setManualMode(true)
              scannerRef.current?.router?.stopCapturing()
              scannerRef.current?.cameraEnhancer?.close()
            }}
            sx={{ mt: 3 }}
          >
            Switch to Manual Input
          </Button>
        </>
      ) : (
        <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
          <TextField
            label='Enter Bin Code'
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton onClick={handleManualSubmit}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            variant='contained'
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleManualSubmit}
          >
            Confirm
          </Button>
        </Box>
      )}

      <Button
        onClick={handleCancel}
        sx={{
          mt: 3,
          backgroundColor: '#e53935',
          color: 'white',
          px: 4,
          py: 1,
          borderRadius: 2,
          fontWeight: 'bold',
          display: 'block',
          mx: 'auto'
        }}
      >
        Cancel
      </Button>

      {error && (
        <Typography
          color='error'
          mt={2}
          textAlign='center'
          fontWeight='bold'
          fontSize='16px'
        >
          {error}
        </Typography>
      )}
    </Box>
  )
}

export default ScanBasic
