import { useEffect, useRef, useState } from 'react'
import { BarcodeScanner } from 'dynamsoft-barcode-reader-bundle'
import { useNavigate } from 'react-router-dom'
import { useBin } from 'hooks/useBin'
import { useProduct } from 'hooks/useProduct'
import { ProductType } from 'types/product'
import ProductCard from './ProductCard'
import { dynamsoftConfig } from 'utils/dynamsoftConfig'
import {
  Box,
  Button,
  TextField,
  Autocomplete,
  InputAdornment,
  IconButton
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'

const Scan = () => {
  const { t } = useTranslation()
  const scannerRef = useRef<any>(null)
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
      const scanner = new BarcodeScanner(dynamsoftConfig)
      scannerRef.current = scanner

      const result = await scanner.launch()
      const barcodeResult = result.barcodeResults?.[0]

      if (!barcodeResult || !barcodeResult.text) return

      const barcodeText = barcodeResult.text.trim()
      const format =
        (barcodeResult as any).barcodeFormatString || 'Unknown Format'

      console.log('📦 Scanned Content:', barcodeText)
      console.log('🔍 Format Type:', format)

      await processBarcode(barcodeText)
    }

    init()

    return () => {
      if (scannerRef.current?.hide) {
        scannerRef.current.hide()
      }
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
          alert(t('scan.productNotFound'))
        }
      } catch (err) {
        console.error('查询产品失败:', err)
        alert(t('scan.productError'))
      }
    } else {
      try {
        const bin = await fetchBinByCode(barcodeText)
        navigate('/create-task', { state: { bin } })
      } catch (err) {
        console.error('Bin查找失败:', err)
        alert(t('scan.invalidBinCode'))
      }
    }
  }

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return alert(t('scan.enterPrompt'))
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
      <h2 style={{ marginBottom: 20 }}>{t('scan.title')}</h2>

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
    </Box>
  )
}

export default Scan
