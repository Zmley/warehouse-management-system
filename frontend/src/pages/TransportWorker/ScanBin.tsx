import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Typography,
  Autocomplete,
  InputAdornment,
  TextField,
  IconButton,
  Drawer
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'
import { useCart } from 'hooks/useCart'
import { useBin } from 'hooks/useBin'
import { useInventory } from 'hooks/useInventory'
import LoadConfirm from './components/LoadConfirm'
import { ScanMode } from 'constants/index'

declare global {
  interface Window {
    Dynamsoft: any
  }
}

const license = process.env.REACT_APP_DYNAMSOFT_LICENSE || ''

const ScanBin = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const scannerRef = useRef<any>(null)
  const scannedRef = useRef(false)

  const { unloadCart } = useCart()
  const { fetchBinCodes, binCodes } = useBin()
  const { fetchInventoriesByBinCode } = useInventory()

  const scanMode: ScanMode = location.state?.mode ?? ScanMode.LOAD
  const unloadProductList = location.state?.unloadProductList ?? []

  const [manualMode, setManualMode] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [scannedBinCode, setScannedBinCode] = useState<string | null>(null)
  const [inventoryList, setInventoryList] = useState([])
  const [showDrawer, setShowDrawer] = useState(false)

  useEffect(() => {
    fetchBinCodes()
  }, [])

  const handleScanOrManualSubmit = async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) {
      setError(t('scan.enterPrompt'))
      return
    }

    if (scanMode === ScanMode.UNLOAD) {
      const result = await unloadCart(trimmed, unloadProductList)
      if (result.success) {
        navigate('/success')
      } else {
        scannerRef.current?.router?.stopCapturing()
        scannerRef.current?.cameraEnhancer?.close()
        setError(result.error || t('scan.unloadFailed'))
      }
    } else {
      const result = await fetchInventoriesByBinCode(trimmed)
      if (result.success && result.inventories?.length > 0) {
        setScannedBinCode(trimmed)
        setInventoryList(result.inventories)
        setShowDrawer(true)
      } else {
        setError(result.message || t('scan.noInventoryFound'))
      }
    }
  }

  useEffect(() => {
    if (manualMode) return

    const initScanner = async () => {
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
              await handleScanOrManualSubmit(text)
              break
            }
          }
        }

        router.addResultReceiver(receiver)
        await cameraEnhancer.open()
        await router.startCapturing('ReadBarcodes_SpeedFirst')

        scannerRef.current = { router, cameraEnhancer }
      } catch (err) {
        console.error('Scanner error:', err)
        setError(t('scan.operationError'))
      }
    }

    initScanner()

    return () => {
      scannerRef.current?.router?.stopCapturing()
      scannerRef.current?.cameraEnhancer?.close()
    }
  }, [manualMode])

  const handleCancel = () => {
    scannerRef.current?.router?.stopCapturing()
    scannerRef.current?.cameraEnhancer?.close()
    navigate('/')
    setTimeout(() => window.location.reload(), 0)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        px: 2,
        py: 4
      }}
    >
      <Typography fontSize='18px' fontWeight='bold' mb={2}>
        {manualMode
          ? t('scan.manualInputBinCodeTitle')
          : scanMode === ScanMode.UNLOAD
          ? t('scan.scanBinCode')
          : t('scan.scanBinCode')}
      </Typography>

      {!manualMode && (
        <Box
          id='scanner-view'
          sx={{
            height: 300,
            width: '90%',
            maxWidth: 500,
            borderRadius: 3,
            overflow: 'hidden',
            border: '2px solid #ccc',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2
          }}
        />
      )}

      {manualMode && (
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <Autocomplete
            freeSolo
            disableClearable
            options={binCodes}
            value={manualInput}
            onInputChange={(_, newValue) => setManualInput(newValue)}
            filterOptions={(options, state) =>
              state.inputValue.length < 1
                ? []
                : options.filter(opt =>
                    opt.toLowerCase().includes(state.inputValue.toLowerCase())
                  )
            }
            renderInput={params => (
              <TextField
                {...params}
                label={t('scan.enterBinCode')}
                onKeyDown={e =>
                  e.key === 'Enter' && handleScanOrManualSubmit(manualInput)
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        onClick={() => handleScanOrManualSubmit(manualInput)}
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
          <Button
            variant='contained'
            onClick={() => handleScanOrManualSubmit(manualInput)}
            fullWidth
            sx={{ mt: 2 }}
          >
            {t('scan.submit')}
          </Button>
        </Box>
      )}

      {!manualMode && (
        <Button
          variant='outlined'
          onClick={() => {
            setManualMode(true)
            scannerRef.current?.router?.stopCapturing()
            scannerRef.current?.cameraEnhancer?.close()
          }}
          sx={{ mt: 3, mb: 2 }}
        >
          {t('scan.switchToManual')}
        </Button>
      )}

      <Button
        onClick={handleCancel}
        sx={{
          background: 'linear-gradient(to right, #e53935, #ef5350)',
          color: 'white',
          px: 6,
          py: 1.5,
          borderRadius: 3,
          fontWeight: 'bold',
          fontSize: '1rem',
          boxShadow: '0 4px 12px rgba(239, 83, 80, 0.4)',
          mt: 2
        }}
      >
        {t('scan.cancel')}
      </Button>

      {error && (
        <Typography color='error' mt={2} fontWeight='bold' textAlign='center'>
          {error}
        </Typography>
      )}

      {showDrawer && scannedBinCode && (
        <Drawer
          anchor='top'
          open={showDrawer}
          onClose={() => {
            setShowDrawer(false)
            setScannedBinCode(null)
            setInventoryList([])
            navigate('/')
            setTimeout(() => window.location.reload(), 0)
          }}
          PaperProps={{
            sx: { maxHeight: '90vh', borderRadius: '0 0 16px 16px', p: 2 }
          }}
        >
          <LoadConfirm
            binCode={scannedBinCode}
            inventories={inventoryList}
            onSuccess={() => {
              setShowDrawer(false)
              setScannedBinCode(null)
              setInventoryList([])
              navigate('/success')
            }}
          />
        </Drawer>
      )}
    </Box>
  )
}

export default ScanBin
