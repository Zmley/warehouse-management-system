import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Typography,
  Fade,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Autocomplete,
  InputAdornment,
  IconButton
} from '@mui/material'
import CancelIcon from '@mui/icons-material/Cancel'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'
import useQRScanner from 'hooks/useQRScanner'
import { useProduct } from 'hooks/useProduct'
import AddToCartInline from 'pages/TransportWorker/AddToCartInline'
import { ProductType } from 'types/product'
import { useTranslation } from 'react-i18next'

const ScanProductQRCode = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'scanner' | 'manual'>('scanner')
  const [hasScanned, setHasScanned] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<ProductType | null>(null)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const { fetchProduct, productCodes, loadProducts } = useProduct()

  const { videoRef, startScanning, stopScanning } =
    useQRScanner(handleScanSuccess)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (mode === 'scanner') {
      startScanning()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
      const stream = (videoRef.current as HTMLVideoElement | null)?.srcObject
      if (stream && stream instanceof MediaStream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [mode])

  async function handleScanSuccess(code: string) {
    if (hasScanned || !/^\d{12}$/.test(code)) return
    setHasScanned(true)
    await handleFetchProduct(code)
  }

  async function handleFetchProduct(code: string) {
    setIsLoadingProduct(true)
    try {
      const product = await fetchProduct(code)
      if (product) {
        setScannedProduct(product)
        stopScanning()
        const stream = (videoRef.current as HTMLVideoElement | null)?.srcObject
        if (stream && stream instanceof MediaStream) {
          stream.getTracks().forEach(track => track.stop())
        }
      } else {
        alert(t('scan.productNotFound'))
        setHasScanned(false)
      }
    } catch (err) {
      alert(t('scan.fetchError'))
      setHasScanned(false)
    } finally {
      setIsLoadingProduct(false)
    }
  }

  const filterOptions = (
    options: string[],
    { inputValue }: { inputValue: string }
  ) => {
    if (!inputValue) return []
    return options.filter(option =>
      option.toLowerCase().startsWith(inputValue.toLowerCase())
    )
  }

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2
      }}
    >
      <Fade in timeout={600}>
        <Paper
          elevation={6}
          sx={{
            p: 3,
            borderRadius: 4,
            width: '100%',
            maxWidth: 420,
            backgroundColor: '#fff'
          }}
        >
          <Typography
            variant='h5'
            fontWeight='bold'
            align='center'
            gutterBottom
          >
            {t('scan.scanProduct')}
          </Typography>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode) setMode(newMode)
            }}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              mb: 3,
              '& .MuiToggleButton-root': {
                fontWeight: 'bold',
                px: 3
              },
              '& .Mui-selected': {
                backgroundColor: '#1976d2 !important',
                color: '#fff'
              }
            }}
          >
            <ToggleButton value='scanner'>{t('scan.modeScanner')}</ToggleButton>
            <ToggleButton value='manual'>{t('scan.modeManual')}</ToggleButton>
          </ToggleButtonGroup>

          {mode === 'scanner' && (
            <Box position='relative' width='100%' height='240px' mt={1.5}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 12,
                  border: '2px solid #ddd'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '40%',
                  left: '10%',
                  width: '80%',
                  height: '20%',
                  border: '2px dashed #1976d2',
                  borderRadius: 4,
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: '100%',
                  height: '2px',
                  background:
                    'linear-gradient(to right, transparent, #42a5f5, transparent)',
                  animation: 'scanLineX 2s infinite',
                  zIndex: 11,
                  pointerEvents: 'none',
                  transform: 'translateY(-50%)'
                }}
              />
              <Typography
                align='center'
                sx={{
                  position: 'absolute',
                  bottom: -28,
                  width: '100%',
                  fontSize: 14,
                  color: '#333',
                  fontWeight: 'bold'
                }}
              >
                {t('scan.alignPrompt')}
              </Typography>
              <style>
                {`
                  @keyframes scanLineX {
                    0% { left: 0%; }
                    50% { left: 100%; transform: translateX(-100%) translateY(-50%); }
                    100% { left: 0%; }
                  }
                `}
              </style>
            </Box>
          )}

          {mode === 'manual' && (
            <Box mt={2}>
              <Autocomplete
                freeSolo
                disableClearable
                options={productCodes}
                value={manualCode}
                onInputChange={(_, newValue) => setManualCode(newValue)}
                filterOptions={filterOptions}
                noOptionsText=''
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('scan.enterProductCode')}
                    variant='outlined'
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleFetchProduct(manualCode)
                      }
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            onClick={() => handleFetchProduct(manualCode)}
                          >
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Box>
          )}

          {isLoadingProduct && (
            <Typography color='primary' mt={2} align='center'>
              {t('scan.loadingProduct')}
            </Typography>
          )}

          {scannedProduct && (
            <Box mt={4}>
              <AddToCartInline
                product={scannedProduct}
                onSuccess={() => navigate('/')}
              />
            </Box>
          )}

          <Button
            startIcon={<CancelIcon />}
            variant='outlined'
            color='error'
            fullWidth
            sx={{
              mt: 4,
              borderRadius: 2,
              fontWeight: 'bold',
              fontSize: 15,
              py: 1.2,
              borderWidth: 2,
              '&:hover': {
                backgroundColor: '#ffe5e5',
                borderColor: '#d32f2f'
              }
            }}
            onClick={() => navigate(-1)}
          >
            {t('scan.cancel')}
          </Button>
        </Paper>
      </Fade>
    </Box>
  )
}

export default ScanProductQRCode
