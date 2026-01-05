import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  TextField,
  Stack,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  useMediaQuery,
  Typography
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import ClearIcon from '@mui/icons-material/Clear'
import ViewWeekIcon from '@mui/icons-material/ViewWeek'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import { useProduct } from 'hooks/useProduct'
import { ProductType } from 'types/product'
import ProductCard from './ProductCard'
import { useTranslation } from 'react-i18next'
import { useDynamsoftScanner } from 'hooks/useDynamsoftScanner'

const license = process.env.REACT_APP_DYNAMSOFT_LICENSE || ''

const BORDER = '#e5e7eb'
const PRIMARY = '#2563eb'

declare global {
  interface Window {
    Dynamsoft: any
  }
}

const SearchProduct: React.FC = () => {
  const { t } = useTranslation()
  const { fetchProduct, fetchProductCodes, productCodes } = useProduct()

  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))

  const inputRef = useRef<HTMLInputElement | null>(null)

  const [showScanner, setShowScanner] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<ProductType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [snackOpen, setSnackOpen] = useState(false)

  const [autoOpen, setAutoOpen] = useState(false)

  useEffect(() => {
    fetchProductCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'
      if (isCmdK) {
        e.preventDefault()
        inputRef.current?.focus()
        setAutoOpen(barcode.trim().length >= 1)
      }
      if (e.key === 'Escape' && showScanner) handleCloseScanner()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [barcode, showScanner])

  const handleSearch = useCallback(
    async (code?: string) => {
      setError(null)
      setLoading(true)
      setProduct(null)
    try {
      const target = (code ?? barcode).trim()
      if (!target) {
        setError(t('queryProduct.errorEmpty'))
        setSnackOpen(true)
        return
      }
      const p = await fetchProduct(target)
      if (!p) {
        setError(t('queryProduct.notFound'))
        setSnackOpen(true)
      } else {
        setProduct(p)
        setSnackOpen(true)
      }
    } catch (e: any) {
      console.error(e)
      setError(e?.message || t('queryProduct.errorQuery'))
      setSnackOpen(true)
    } finally {
      setLoading(false)
    }
    },
    [barcode, fetchProduct, t]
  )

  const handleDetected = useCallback(
    (text: string) => {
      setBarcode(text)
      setShowScanner(false)
      setAutoOpen(false)
      handleSearch(text)
    },
    [handleSearch]
  )

  const handleScannerError = useCallback(
    (err: unknown) => {
      console.error('Scanner init failed:', err)
      setError(t('queryProduct.errorInit'))
      setSnackOpen(true)
      setShowScanner(false)
    },
    [t]
  )

  const { stop: stopScanner, reset: resetScanner } = useDynamsoftScanner({
    enabled: showScanner,
    license,
    containerSelector: '.query-product-inline-scanner',
    onDetected: handleDetected,
    onError: handleScannerError
  })

  const handleOpenScanner = () => {
    setProduct(null)
    setError(null)
    setShowScanner(true)
    setAutoOpen(false)
    resetScanner()
  }

  const handleCloseScanner = () => {
    stopScanner()
    setShowScanner(false)
    resetScanner()
  }

  const clearInput = () => {
    setBarcode('')
    setAutoOpen(false)
    setProduct(null)
  }

  const scannerH = isXs ? '28dvh' : '320px'
  const listMaxH = '40dvh'

  return (
    <Box
      sx={{
        minHeight: '100%',
        bgcolor: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 1, sm: 2 }
      }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${BORDER}`,
          background: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          maxWidth: 900,
          mx: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 1,
            borderBottom: `1px solid ${BORDER}`,
            bgcolor: '#fff'
          }}
        >
          <ViewWeekIcon fontSize='small' />
          <Typography variant='subtitle1' fontWeight={800}>
            {t('queryProduct.title')}
          </Typography>
        </Box>

        <CardContent sx={{ p: { xs: 1.25, sm: 2 }, pb: 1 }}>
          <Paper
            variant='outlined'
            sx={{
              p: { xs: 1, sm: 1.25 },
              borderRadius: 2,
              borderColor: BORDER,
              background: '#fff'
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Autocomplete
                options={productCodes || []}
                freeSolo
                inputValue={barcode}
                open={autoOpen && (barcode || '').trim().length >= 1}
                disablePortal
                ListboxProps={{
                  style: { maxHeight: listMaxH, overscrollBehavior: 'contain' }
                }}
                onOpen={() => {
                  if ((barcode || '').trim().length >= 1) setAutoOpen(true)
                }}
                onClose={() => setAutoOpen(false)}
                onInputChange={(_, newInput) => {
                  const v = newInput ?? ''
                  setBarcode(v)
                  setAutoOpen(v.trim().length >= 1)
                }}
                onChange={(_, value) => {
                  if (typeof value === 'string') {
                    setBarcode(value)
                    setAutoOpen(false)
                    handleSearch(value)
                  }
                }}
                filterOptions={(options, { inputValue }) => {
                  const q = (inputValue || '').trim().toLowerCase()
                  if (q.length < 1) return []
                  return options
                    .filter(opt => (opt || '').toLowerCase().startsWith(q))
                    .slice(0, 50)
                }}
                noOptionsText={
                  (barcode || '').trim().length < 1
                    ? ''
                    : t('queryProduct.noMatch')
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    inputRef={inputRef}
                    size='small'
                    label={t('queryProduct.inputLabel')}
                    placeholder={t('queryProduct.inputPlaceholder')}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        setAutoOpen(false)
                        handleSearch()
                      }
                    }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <Stack
                          direction='row'
                          alignItems='center'
                          spacing={0.5}
                          sx={{ pl: 1 }}
                        >
                          <ViewWeekIcon fontSize='small' />
                          {params.InputProps.startAdornment}
                        </Stack>
                      ),
                      endAdornment: (
                        <Stack
                          direction='row'
                          alignItems='center'
                          spacing={0.25}
                          sx={{ pr: 0.5 }}
                        >
                          {!!barcode && (
                            <IconButton size='small' onClick={clearInput}>
                              <ClearIcon fontSize='small' />
                            </IconButton>
                          )}
                          {params.InputProps.endAdornment}
                        </Stack>
                      )
                    }}
                  />
                )}
                sx={{ flex: 1, minWidth: 0 }}
              />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                <Button
                  variant='contained'
                  startIcon={<SearchIcon />}
                  onClick={() => {
                    setAutoOpen(false)
                    handleSearch()
                  }}
                  disabled={loading}
                  fullWidth={isXs}
                  size='small'
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    bgcolor: PRIMARY,
                    '&:hover': { bgcolor: '#1e4fd6' }
                  }}
                >
                  {loading
                    ? t('queryProduct.searching')
                    : t('queryProduct.searchBtn')}
                </Button>

                {!showScanner ? (
                  <Button
                    variant='outlined'
                    startIcon={
                      <DocumentScannerIcon
                        sx={{ transform: 'rotate(90deg)' }}
                      />
                    }
                    onClick={handleOpenScanner}
                    disabled={loading}
                    fullWidth={isXs}
                    size='small'
                    sx={{ textTransform: 'none', borderColor: BORDER }}
                  >
                    {t('queryProduct.scanBtn')}
                  </Button>
                ) : (
                  <Button
                    color='error'
                    variant='outlined'
                    startIcon={<CloseIcon />}
                    onClick={handleCloseScanner}
                    fullWidth={isXs}
                    size='small'
                    sx={{ textTransform: 'none' }}
                  >
                    {t('queryProduct.closeScannerBtn')}
                  </Button>
                )}
              </Stack>
            </Stack>

            {showScanner && (
              <Box
                className='query-product-inline-scanner'
                sx={{
                  mt: 1,
                  height: scannerH,
                  maxWidth: '100%',
                  border: `1px dashed ${BORDER}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                  bgcolor: 'background.default'
                }}
              />
            )}
          </Paper>
        </CardContent>

        <CardContent
          sx={{
            pt: 0,
            px: { xs: 1.25, sm: 2 },
            pb: { xs: 1.25, sm: 2 },
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            bgcolor: '#fff'
          }}
        >
          {product && (
            <Box sx={{ maxWidth: 560, mx: 'auto' }}>
              <ProductCard product={product} />
            </Box>
          )}

          {loading && (
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1,
                mt: 1
              }}
            >
              <LinearProgress />
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 'env(safe-area-inset-top)' }}
      >
        {error ? (
          <Alert
            severity='error'
            onClose={() => setSnackOpen(false)}
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        ) : (
          <Alert
            severity='success'
            onClose={() => setSnackOpen(false)}
            sx={{ width: '100%' }}
          >
            {t('queryProduct.success')}
          </Alert>
        )}
      </Snackbar>
    </Box>
  )
}

export default SearchProduct
