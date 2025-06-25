import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { ProductType } from 'types/product'
import ProductCard from './ProductCard'
import {
  Box,
  Button,
  TextField,
  Autocomplete,
  InputAdornment,
  IconButton,
  Typography
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'

// Dynamsoft Global
const license =
  'DLS2eyJoYW5kc2hha2VDb2RlIjoiMTA0MTYzMjYwLVRYbFhaV0pRY205cSIsIm1haW5TZXJ2ZXJVUkwiOiJodHRwczovL21kbHMuZHluYW1zb2Z0b25saW5lLmNvbSIsIm9yZ2FuaXphdGlvbklEIjoiMTA0MTYzMjYwIiwic3RhbmRieVNlcnZlclVSTCI6Imh0dHBzOi8vc2Rscy5keW5hbXNvZnRvbmxpbmUuY29tIiwiY2hlY2tDb2RlIjoxMTQyNzEzNDB9'
declare global {
  interface Window {
    Dynamsoft: any
  }
}

const Scan = () => {
  const { t } = useTranslation()
  const scannerRef = useRef<any>(null)
  const scannedRef = useRef(false)
  const navigate = useNavigate()
  const { fetchBinByCode, binCodes, fetchBinCodes } = useBin()
  const { fetchProduct, productCodes, loadProducts } = useProduct()

  const [product, setProduct] = useState<ProductType | null>(null)
  const [showScanner, setShowScanner] = useState(true)
  const [manualMode, setManualMode] = useState(false)
  const [manualInput, setManualInput] = useState('')

  useEffect(() => {
    fetchBinCodes()
    loadProducts()
  }, [])

  useEffect(() => {
    if (manualMode) return

    const init = async () => {
      try {
        const { Dynamsoft } = window
        await Dynamsoft.License.LicenseManager.initLicense(license)
        await Dynamsoft.Core.CoreModule.loadWasm(['DBR'])

        const cameraView = await Dynamsoft.DCE.CameraView.createInstance()
        const cameraEnhancer =
          await Dynamsoft.DCE.CameraEnhancer.createInstance(cameraView)

        document
          .querySelector('.barcode-scanner-view')
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
              await processBarcode(text)
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
      }
    }

    init()

    return () => {
      scannerRef.current?.router?.stopCapturing()
      scannerRef.current?.cameraEnhancer?.close()
    }
  }, [manualMode])

  const processBarcode = async (barcodeText: string) => {
    if (/^\d{12}$/.test(barcodeText)) {
      try {
        const fetched = await fetchProduct(barcodeText)
        if (fetched) {
          setProduct(fetched)
          setShowScanner(false)
        } else {
          console.log(t('scan.productNotFound'))
        }
      } catch (err) {
        console.error('查询产品失败:', err)
      }
    } else {
      try {
        const bin = await fetchBinByCode(barcodeText)
        navigate('/create-task', { state: { bin } })
      } catch (err) {
        console.error('Bin查找失败:', err)
      }
    }
  }

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return
    await processBarcode(manualInput.trim())
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
    window.location.reload()
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
        sx={{ mt: 1, mb: 2, fontSize: '14px', textAlign: 'center' }}
        fontWeight='bold'
      >
        {t('scan.title')}
      </Typography>

      {showScanner && !manualMode && (
        <Box
          sx={{
            height: 300,
            width: 500,
            borderRadius: 3,
            overflow: 'hidden',
            border: '2px solid #ccc',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 2
          }}
          className='barcode-scanner-view'
        />
      )}

      {!showScanner && product && (
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <ProductCard product={product} />
        </Box>
      )}

      {manualMode && (
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
                label={t('scan.inputLabel')}
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

      {!manualMode && !product && (
        <Button
          variant='outlined'
          onClick={() => {
            setManualMode(true)
            setShowScanner(false)
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
    </Box>
  )
}

export default Scan
