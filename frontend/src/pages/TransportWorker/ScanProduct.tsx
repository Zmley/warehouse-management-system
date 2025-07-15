import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Button, Typography, Drawer } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useCart } from 'hooks/useCart'
import { useProduct } from 'hooks/useProduct'
import { ScanMode } from 'constants/index'
import { ProductType } from 'types/product'
import MultiProductInputBox from './components/ManualInputBox'

declare global {
  interface Window {
    Dynamsoft: any
  }
}

const license = process.env.REACT_APP_DYNAMSOFT_LICENSE || ''

const ScanProduct = () => {
  const { t } = useTranslation()
  const scannerRef = useRef<any>(null)
  const scannedRef = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { unloadCart, error: cartError, loadCart } = useCart()
  const { fetchProduct, productCodes, loadProducts } = useProduct()

  const scanMode: ScanMode = location.state?.mode ?? ScanMode.LOAD
  const unloadProductList = location.state?.unloadProductList ?? []

  const [manualMode, setManualMode] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannedProduct] = useState<ProductType | null>(null)
  const [defaultManualItems, setDefaultManualItems] = useState<
    { productCode: string; quantity: string }[]
  >([])

  useEffect(() => {
    loadProducts()
  }, [])

  const parseProductList = (
    text: string
  ): { productCode: string; quantity: string }[] => {
    const entries = text.split(',').map(pair => pair.trim())
    const result: { productCode: string; quantity: string }[] = []

    for (const entry of entries) {
      const [code, qty] = entry.split(':').map(s => s.trim())
      if (code && qty && /^\d+$/.test(qty)) {
        result.push({ productCode: code, quantity: qty })
      }
    }
    return result
  }

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
            if (!text) continue

            scannedRef.current = true

            try {
              if (text.includes(':') && text.includes(',')) {
                const parsedList = parseProductList(text)
                if (parsedList.length > 0) {
                  setDefaultManualItems(parsedList)
                  setManualMode(true)
                  setShowDrawer(true)
                } else {
                  setError(t('scan.invalidProductCode'))
                }
              } else if (/^\d{8,}$/.test(text)) {
                const product = await fetchProduct(text)
                if (product) {
                  setDefaultManualItems([
                    { productCode: product.productCode, quantity: '1' }
                  ])
                  setManualMode(true)
                  setShowDrawer(true)
                } else {
                  setError(t('scan.productNotFound'))
                }
              } else {
                if (scanMode === ScanMode.UNLOAD) {
                  await unloadCart(text, unloadProductList)
                } else {
                  setError(t('scan.invalidProductCode'))
                }
              }
            } catch (err) {
              console.error('🚨 scan fail:', err)
              setError(t('scan.operationError'))
            }

            await router.stopCapturing()
            await cameraEnhancer.close()
            break
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
  }, [manualMode])

  const handleManualSubmit = async (
    items: { productCode: string; quantity: number }[]
  ) => {
    const result = await loadCart({ productList: items })

    if (!result.success) {
      setError(result.error || t('scan.operationError'))
      return
    }

    navigate('/success')
  }

  const handleCancel = () => {
    scannerRef.current?.router?.stopCapturing()
    scannerRef.current?.cameraEnhancer?.close()
    navigate('/')
    // setTimeout(() => window.location.reload(), 0)
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
          ? t('scan.manualInputProductCodeTitle')
          : t('scan.scanProductCode')}
      </Typography>

      {!manualMode && !scannedProduct && (
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

      {!manualMode && !scannedProduct && (
        <Button
          variant='outlined'
          onClick={() => {
            setManualMode(true)
            setShowDrawer(true)
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

      <Drawer
        anchor='top'
        open={showDrawer}
        onClose={handleCancel}
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '0 0 16px 16px',
            p: 2,
            bgcolor: '#fff'
          }
        }}
      >
        <MultiProductInputBox
          productOptions={productCodes}
          onSubmit={handleManualSubmit}
          defaultItems={defaultManualItems}
        />
      </Drawer>
    </Box>
  )
}

export default ScanProduct
