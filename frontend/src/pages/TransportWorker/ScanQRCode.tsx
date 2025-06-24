import { useEffect, useRef, useState } from 'react'
import { BarcodeScanner } from 'dynamsoft-barcode-reader-bundle'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Typography,
  TextField,
  Autocomplete,
  InputAdornment,
  IconButton
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'

import { useCart } from 'hooks/useCart'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { dynamsoftConfig } from 'utils/dynamsoftConfig'
import { ScanMode } from 'constants/index'
import AddToCartInline from 'pages/TransportWorker/AddToCartInline'
import { ProductType } from 'types/product'

const ScanCode = () => {
  const { t } = useTranslation()
  const scannerRef = useRef<any>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { loadCart, unloadCart, error: cartError } = useCart()
  const { fetchBinCodes, binCodes } = useBin()
  const { fetchProduct, productCodes, loadProducts } = useProduct()

  const scanMode: ScanMode = location.state?.mode ?? ScanMode.LOAD
  const unloadProductList = location.state?.unloadProductList ?? []

  const [manualMode, setManualMode] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [scannedProduct, setScannedProduct] = useState<ProductType | null>(null)

  useEffect(() => {
    fetchBinCodes()
    loadProducts()
  }, [])

  useEffect(() => {
    if (manualMode) return

    const init = async () => {
      try {
        const scanner = new BarcodeScanner(dynamsoftConfig)
        scannerRef.current = scanner
        const result = await scanner.launch()
        const scannedText = result.barcodeResults?.[0]?.text?.trim()
        if (!scannedText) {
          setError(t('scan.notRecognized'))
          return
        }

        if (isProductCode(scannedText)) {
          const product = await fetchProduct(scannedText)
          if (product) {
            setScannedProduct(product)
          } else {
            setError(t('scan.productNotFound'))
          }
        } else {
          await handleScan(scannedText)
        }
      } catch (err) {
        console.error('Scan error:', err)
        setError(t('scan.operationError'))
      }
    }

    init()

    return () => {
      if (scannerRef.current?.hide) scannerRef.current.hide()
    }
  }, [manualMode])

  const isProductCode = (code: string) => {
    return /^\d{8,}$/.test(code) // 假设产品码为纯数字 8 位以上
  }

  const handleScan = async (binCode: string) => {
    setError(null)
    try {
      if (scanMode === ScanMode.UNLOAD) {
        await unloadCart(binCode, unloadProductList)
      } else {
        await loadCart({ binCode })
      }
    } catch (err) {
      console.error('操作失败:', err)
      setError(t('scan.operationError'))
    }
  }

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      setError(t('scan.enterPrompt'))
      return
    }
    await handleScan(manualInput.trim())
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
    if (scannerRef.current?.hide) {
      scannerRef.current.hide()
    }
    navigate('/')
    setTimeout(() => {
      window.location.reload()
    }, 0)
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
          : t('scan.scanProductCode')}{' '}
      </Typography>

      {!manualMode && !scannedProduct && (
        <Box
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
          className='barcode-scanner-view'
        />
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
            }}
          />
        </Box>
      )}

      {!manualMode && !scannedProduct && (
        <Button
          variant='outlined'
          onClick={() => {
            setManualMode(true)
            if (scannerRef.current?.hide) {
              scannerRef.current.hide()
            }
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
