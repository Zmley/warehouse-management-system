import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Typography,
  Drawer,
  Autocomplete,
  InputAdornment,
  TextField,
  IconButton
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'
import { useCart } from 'hooks/useCart'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { ScanMode } from 'constants/index'
import { ProductType } from 'types/product'
import { useInventory } from 'hooks/useInventory'
import { InventoryItem } from 'types/inventory'
import LoadConfirm from './components/LoadConfirm'
import MultiProductInputBox from './components/ManualInputBox'

declare global {
  interface Window {
    Dynamsoft: any
  }
}

const license = process.env.REACT_APP_DYNAMSOFT_LICENSE || ''

const ScanCode = () => {
  const { t } = useTranslation()
  const scannerRef = useRef<any>(null)
  const scannedRef = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { unloadCart, error: cartError, loadCart } = useCart()
  const { fetchBinCodes, binCodes } = useBin()
  const { fetchProduct, productCodes, loadProducts } = useProduct()

  const scanMode: ScanMode = location.state?.mode ?? ScanMode.LOAD
  const unloadProductList = location.state?.unloadProductList ?? []

  const [manualMode, setManualMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannedProduct] = useState<ProductType | null>(null)
  const [defaultManualItems, setDefaultManualItems] = useState<
    { productCode: string; quantity: string }[]
  >([])

  const { fetchInventoriesByBinCode } = useInventory()
  const [scannedBinCode, setScannedBinCode] = useState<string | null>(null)
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([])
  const [showDrawer, setShowDrawer] = useState(false)
  const [manualInput, setManualInput] = useState('')

  useEffect(() => {
    fetchBinCodes()
    loadProducts()
  }, [])

  const handleUnloadWithCart = (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) {
      setError(t('scan.enterPrompt'))
      return
    }

    unloadCart(trimmed, unloadProductList)
  }

  useEffect(() => {
    if (manualMode || scannedBinCode || showDrawer) return

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

              if (/^\d{8,}$/.test(text)) {
                const product = await fetchProduct(text)
                if (product) {
                  setDefaultManualItems([
                    { productCode: product.productCode, quantity: '1' }
                  ])
                  setManualMode(true)
                } else {
                  setError(t('scan.productNotFound'))
                }
              } else {
                try {
                  if (scanMode === ScanMode.UNLOAD) {
                    await unloadCart(text, unloadProductList)
                  } else {
                    const result = await fetchInventoriesByBinCode(text)

                    if (
                      result.success &&
                      result.inventories &&
                      result.inventories.length > 0
                    ) {
                      setScannedBinCode(text)
                      setInventoryList(result.inventories)
                      setShowDrawer(true)
                      await router.stopCapturing()
                      await cameraEnhancer.close()
                    } else {
                      setError(result.message || t('scan.noInventoryFound'))
                    }
                  }
                } catch (err) {
                  console.error('操作失败:', err)
                  setError(t('scan.operationError'))
                }
              }

              await router.stopCapturing()
              await cameraEnhancer.close()
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
        setError(t('scan.operationError'))
      }
    }

    loadAndInit()

    return () => {
      scannerRef.current?.router?.stopCapturing()
      scannerRef.current?.cameraEnhancer?.close()
    }
  }, [manualMode, scannedBinCode, showDrawer])

  const handleManualSubmit = async (
    items: { productCode: string; quantity: number }[]
  ) => {
    for (const item of items) {
      const result = await loadCart(item)
      if (!result.success) {
        setError(result.error || t('scan.operationError'))
        return
      }
    }

    navigate('/success')
  }

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
      <Typography
        fontSize='18px'
        variant='h5'
        mb={2}
        fontWeight='bold'
        sx={{ mt: 1, textAlign: 'center' }}
      >
        {manualMode
          ? t('scan.manualInputTitle')
          : scanMode === ScanMode.UNLOAD
          ? t('scan.scanBinCode')
          : t('scan.scanProductCode')}
      </Typography>

      {!manualMode && !showDrawer && !scannedProduct && !scannedBinCode && (
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
            marginBottom: 2
          }}
        />
      )}

      {/* {manualMode && !scannedBinCode && (
        <MultiProductInputBox
          productOptions={productCodes}
          onSubmit={handleManualSubmit}
          defaultItems={defaultManualItems}
        />
      )} */}

      {manualMode &&
        !scannedBinCode &&
        (scanMode === ScanMode.UNLOAD ? (
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
                    e.key === 'Enter' && handleUnloadWithCart(manualInput)
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={() => handleUnloadWithCart(manualInput)}
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
              onClick={() => handleUnloadWithCart(manualInput)}
              fullWidth
              sx={{ mt: 2 }}
            >
              {t('scan.submit')}
            </Button>
          </Box>
        ) : (
          <MultiProductInputBox
            productOptions={productCodes}
            onSubmit={handleManualSubmit}
            defaultItems={defaultManualItems}
          />
        ))}

      {showDrawer && (
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
            binCode={scannedBinCode!}
            inventories={inventoryList}
            onSuccess={() => {
              setShowDrawer(false)
              setScannedBinCode(null)
              setInventoryList([])
              navigate('/')
            }}
          />
        </Drawer>
      )}

      {!manualMode && !scannedProduct && !scannedBinCode && !showDrawer && (
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

      {(error || cartError) && (
        <Typography color='error' mt={2} fontWeight='bold' textAlign='center'>
          {error || cartError}
        </Typography>
      )}
    </Box>
  )
}

export default ScanCode
