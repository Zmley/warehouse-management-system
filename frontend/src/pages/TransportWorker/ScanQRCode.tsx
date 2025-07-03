import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Typography,
  TextField,
  Autocomplete,
  InputAdornment,
  IconButton,
  Drawer
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'
import { useCart } from 'hooks/useCart'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { ScanMode } from 'constants/index'
import AddToCartInline from 'pages/TransportWorker/AddToCartInline'
import { ProductType } from 'types/product'
import { useInventory } from 'hooks/useInventory'
import { InventoryItem } from 'types/inventory'
import LoadConfirmInventory from './LoadConfirmInventory'

// Dynamsoft Scanner globals
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
  const { unloadCart, error: cartError } = useCart()
  const { fetchBinCodes, binCodes } = useBin()
  const { fetchProduct, productCodes, loadProducts } = useProduct()

  const scanMode: ScanMode = location.state?.mode ?? ScanMode.LOAD
  const unloadProductList = location.state?.unloadProductList ?? []

  const [manualMode, setManualMode] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [scannedProduct, setScannedProduct] = useState<ProductType | null>(null)

  const { fetchInventoriesByBinCode } = useInventory()
  const [scannedBinCode, setScannedBinCode] = useState<string | null>(null)
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([])
  const [showDrawer, setShowDrawer] = useState(false)

  useEffect(() => {
    fetchBinCodes()
    loadProducts()
  }, [])

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
                  setScannedProduct(product)
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

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      setError(t('scan.enterPrompt'))
      return
    }

    const input = manualInput.trim()

    if (/^\d{8,}$/.test(input)) {
      const product = await fetchProduct(input)
      if (product) {
        setScannedProduct(product)
      } else {
        setError(t('scan.productNotFound'))
      }
    } else {
      try {
        if (scanMode === ScanMode.UNLOAD) {
          await unloadCart(input, unloadProductList)
        } else {
          const result = await fetchInventoriesByBinCode(input)

          if (
            result.success &&
            result.inventories &&
            result.inventories.length > 0
          ) {
            setScannedBinCode(input)
            setInventoryList(result.inventories)
            setShowDrawer(true)
          } else {
            setError(result.message || t('scan.noInventoryFound'))
          }
        }
      } catch (err) {
        console.error('操作失败:', err)
        setError(t('scan.operationError'))
      }
    }
  }

  const filterBinOptions = (
    options: string[],
    { inputValue }: { inputValue: string }
  ) => {
    if (!inputValue) return []
    return options.filter(option =>
      option.toLowerCase().startsWith(inputValue.toLowerCase())
    )
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
        minHeight: '50vh',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2
      }}
    >
      <Typography
        fontSize='18px'
        variant='h5'
        mb={2}
        fontWeight='bold'
        sx={{ mt: 1, textAlign: 'center' }}
      >
        {scanMode === ScanMode.UNLOAD
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

      {manualMode && !scannedBinCode && (
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <Autocomplete
            freeSolo
            disableClearable
            options={[...binCodes, ...productCodes]}
            value={manualInput}
            onInputChange={(_, newValue) => setManualInput(newValue)}
            filterOptions={filterBinOptions}
            renderInput={params => (
              <TextField
                {...params}
                label={t('scan.enterBinCode')}
                onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton onClick={handleManualSubmit}>
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
            onClick={handleManualSubmit}
            fullWidth
            sx={{ mt: 2 }}
          >
            {t('scan.submit')}
          </Button>
        </Box>
      )}

      {scannedProduct && (
        <Box sx={{ mt: 1, width: '100%', maxWidth: 500 }}>
          <AddToCartInline
            product={scannedProduct}
            onSuccess={() => {
              setScannedProduct(null)
              navigate('/')
              setTimeout(() => window.location.reload(), 0)
            }}
          />
        </Box>
      )}

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
          <LoadConfirmInventory
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
          backgroundColor: '#e53935',
          color: 'white',
          px: 4,
          py: 1,
          borderRadius: 2,
          fontWeight: 'bold',
          mt: 1
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
